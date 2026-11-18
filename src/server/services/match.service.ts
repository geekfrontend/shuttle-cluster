import { prisma, type Tx } from "@/db/client";
import { anyOf } from "@/db/where";
import type { Category, MatchSide, Prisma } from "@/generated/prisma/client";
import { CATEGORIES } from "@/lib/badminton/categories";
import {
  entryKey,
  evaluateMatch,
  type GameScore,
  isValidSide,
  type MatchScoreError,
} from "@/lib/badminton/match-rules";
import type { MessageKey } from "@/lib/i18n/translate";
import { type Pagination, toPage, toSkipTake } from "@/lib/pagination";
import { writeAudit } from "@/server/audit/audit.service";
import type { Session } from "@/server/auth/session";
import { ApiError } from "@/utils/api-error";

const playerRef = { select: { id: true, name: true, country: true } } as const;
const entrySelect = { select: { id: true, player1: playerRef, player2: playerRef } } as const;

const matchSelect = {
  id: true,
  category: true,
  tournament: true,
  round: true,
  playedOn: true,
  winner: true,
  retired: true,
  createdAt: true,
  entryA: entrySelect,
  entryB: entrySelect,
  games: { select: { number: true, scoreA: true, scoreB: true }, orderBy: { number: "asc" } },
} satisfies Prisma.MatchSelect;

type MatchRow = Prisma.MatchGetPayload<{ select: typeof matchSelect }>;

/** Bentuk respons: tanggal tanpa jam (`YYYY-MM-DD`), dan pemain tiap sisi sebagai daftar. */
function toMatch({ entryA, entryB, playedOn, ...match }: MatchRow) {
  const players = (entry: MatchRow["entryA"]) => (entry.player2 ? [entry.player1, entry.player2] : [entry.player1]);
  return {
    ...match,
    playedOn: playedOn.toISOString().slice(0, 10),
    sideA: { entryId: entryA.id, players: players(entryA) },
    sideB: { entryId: entryB.id, players: players(entryB) },
  };
}

export async function listMatches(pagination: Pagination, filter: { q?: string; category?: Category[] }) {
  const name = filter.q ? { contains: filter.q, mode: "insensitive" as const } : undefined;
  const entryHasPlayer = name ? { OR: [{ player1: { name } }, { player2: { name } }] } : undefined;
  const where = {
    category: anyOf(filter.category),
    ...(name ? { OR: [{ tournament: name }, { entryA: entryHasPlayer }, { entryB: entryHasPlayer }] } : {}),
  } satisfies Prisma.MatchWhereInput;

  const [items, total] = await Promise.all([
    prisma.match.findMany({
      where,
      select: matchSelect,
      orderBy: [{ playedOn: "desc" }, { createdAt: "desc" }],
      ...toSkipTake(pagination),
    }),
    prisma.match.count({ where }),
  ]);
  return toPage(items.map(toMatch), total, pagination);
}

const SCORE_ERRORS: Record<MatchScoreError["code"], MessageKey> = {
  game_invalid: "matches.score_game_invalid",
  too_few_games: "matches.score_too_few_games",
  too_many_games: "matches.score_too_many_games",
  extra_game: "matches.score_extra_game",
  winner_required: "matches.winner_required",
};

type CreateMatchInput = {
  category: Category;
  tournament: string;
  round?: string | null;
  playedOn: string;
  sideA: string[];
  sideB: string[];
  games: GameScore[];
  retired: boolean;
  winner?: MatchSide;
};

/** Unit untuk susunan pemain ini di kategori ini; dibuat bila belum ada. */
async function upsertEntry(tx: Tx, category: Category, playerIds: string[]) {
  const [player1Id, player2Id] = [...playerIds].sort();
  const entry = await tx.entry.upsert({
    where: { key: entryKey(category, playerIds) },
    create: { key: entryKey(category, playerIds), category, player1Id, player2Id: player2Id ?? null },
    update: {},
    select: { id: true },
  });
  return entry.id;
}

export async function createMatch(actor: Session, input: CreateMatchInput) {
  const category = CATEGORIES.find((item) => item.code === input.category);
  if (!category) throw ApiError.badRequest();

  const playerIds = [...input.sideA, ...input.sideB];
  if (new Set(playerIds).size !== playerIds.length) throw ApiError.badRequest("matches.same_player");

  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    select: { id: true, gender: true },
  });
  if (players.length !== playerIds.length) throw ApiError.badRequest("matches.player_not_found");
  const genderOf = new Map(players.map((player) => [player.id, player.gender]));

  for (const [side, ids] of [
    ["A", input.sideA],
    ["B", input.sideB],
  ] as const) {
    const genders = ids.map((id) => genderOf.get(id) ?? "male");
    if (!isValidSide(category, genders)) {
      throw ApiError.badRequest("matches.side_invalid", {
        params: { side, category: category.code },
        errors: { [`side${side}`]: ["invalid"] },
      });
    }
  }

  const score = evaluateMatch(input.games, { retired: input.retired, winner: input.winner });
  if (!score.ok) {
    const { error } = score;
    throw ApiError.badRequest(SCORE_ERRORS[error.code], {
      params: error.code === "game_invalid" ? { game: error.game } : undefined,
    });
  }

  return prisma.$transaction(async (tx) => {
    const entryAId = await upsertEntry(tx, input.category, input.sideA);
    const entryBId = await upsertEntry(tx, input.category, input.sideB);
    const match = await tx.match.create({
      data: {
        category: input.category,
        tournament: input.tournament,
        round: input.round ?? null,
        playedOn: new Date(`${input.playedOn}T00:00:00.000Z`),
        entryAId,
        entryBId,
        winner: score.winner,
        retired: input.retired,
        createdById: actor.user.id,
        games: { create: input.games.map((game, index) => ({ number: index + 1, ...game })) },
      },
      select: matchSelect,
    });
    await writeAudit(tx, {
      actorId: actor.user.id,
      action: "matches.create",
      targetType: "match",
      targetId: match.id,
      after: { ...input, round: input.round ?? null, winner: score.winner },
    });
    return toMatch(match);
  });
}

/** Hapus pertandingan; unit yang tidak lagi punya pertandingan ikut dihapus. */
export async function deleteMatch(actor: Session, matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, entryAId: true, entryBId: true, tournament: true, category: true },
  });
  if (!match) throw ApiError.notFound("matches.not_found");

  await prisma.$transaction(async (tx) => {
    await tx.match.delete({ where: { id: matchId } });
    await tx.entry.deleteMany({
      where: { id: { in: [match.entryAId, match.entryBId] }, matchesAsA: { none: {} }, matchesAsB: { none: {} } },
    });
    await writeAudit(tx, {
      actorId: actor.user.id,
      action: "matches.delete",
      targetType: "match",
      targetId: matchId,
      before: { tournament: match.tournament, category: match.category },
    });
  });
}
