import { prisma } from "@/db/client";
import { anyOf } from "@/db/where";
import { type Gender, Prisma } from "@/generated/prisma/client";
import { type Pagination, toPage, toSkipTake } from "@/lib/pagination";
import { writeAudit } from "@/server/audit/audit.service";
import type { Session } from "@/server/auth/session";
import { ApiError } from "@/utils/api-error";

const playerSelect = {
  id: true,
  name: true,
  gender: true,
  country: true,
  externalId: true,
  createdAt: true,
} satisfies Prisma.PlayerSelect;

type PlayerInput = { name: string; gender: Gender; country?: string | null; externalId?: string | null };

/** Jumlah pertandingan per pemain, lewat semua unit (tunggal/pasangan) yang memuat pemain itu. */
async function matchCounts(playerIds: string[]) {
  const entries = await prisma.entry.findMany({
    where: { OR: [{ player1Id: { in: playerIds } }, { player2Id: { in: playerIds } }] },
    select: { player1Id: true, player2Id: true, _count: { select: { matchesAsA: true, matchesAsB: true } } },
  });
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const total = entry._count.matchesAsA + entry._count.matchesAsB;
    for (const id of [entry.player1Id, entry.player2Id]) {
      if (id) counts.set(id, (counts.get(id) ?? 0) + total);
    }
  }
  return counts;
}

export async function listPlayers(pagination: Pagination, filter: { q?: string; gender?: Gender[] }) {
  const where = {
    gender: anyOf(filter.gender),
    ...(filter.q
      ? {
          OR: [
            { name: { contains: filter.q, mode: "insensitive" as const } },
            { country: { equals: filter.q.toUpperCase() } },
            { externalId: { equals: filter.q } },
          ],
        }
      : {}),
  } satisfies Prisma.PlayerWhereInput;

  const [items, total] = await Promise.all([
    prisma.player.findMany({ where, select: playerSelect, orderBy: { name: "asc" }, ...toSkipTake(pagination) }),
    prisma.player.count({ where }),
  ]);
  const counts = await matchCounts(items.map((item) => item.id));
  return toPage(
    items.map((item) => ({ ...item, matchCount: counts.get(item.id) ?? 0 })),
    total,
    pagination,
  );
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createPlayer(actor: Session, input: PlayerInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const player = await tx.player.create({ data: input, select: playerSelect });
      await writeAudit(tx, {
        actorId: actor.user.id,
        action: "players.create",
        targetType: "player",
        targetId: player.id,
        after: input,
      });
      return { ...player, matchCount: 0 };
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw ApiError.conflict("players.external_id_taken");
    throw error;
  }
}

export async function updatePlayer(actor: Session, playerId: string, input: Partial<PlayerInput>) {
  const before = await prisma.player.findUnique({ where: { id: playerId }, select: playerSelect });
  if (!before) throw ApiError.notFound("players.not_found");

  const matchCount = (await matchCounts([playerId])).get(playerId) ?? 0;
  // Gender menentukan kategori yang sah; mengubahnya membuat pertandingan lama tidak konsisten.
  if (input.gender !== undefined && input.gender !== before.gender && matchCount > 0) {
    throw ApiError.conflict("players.gender_locked");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const player = await tx.player.update({ where: { id: playerId }, data: input, select: playerSelect });
      await writeAudit(tx, {
        actorId: actor.user.id,
        action: "players.update",
        targetType: "player",
        targetId: playerId,
        before: { name: before.name, gender: before.gender, country: before.country, externalId: before.externalId },
        after: input,
      });
      return { ...player, matchCount };
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw ApiError.conflict("players.external_id_taken");
    throw error;
  }
}

/** Hanya pemain tanpa pertandingan yang bisa dihapus; unit tanpa pertandingan ikut dihapus. */
export async function deletePlayer(actor: Session, playerId: string) {
  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { id: true, name: true } });
  if (!player) throw ApiError.notFound("players.not_found");
  if (((await matchCounts([playerId])).get(playerId) ?? 0) > 0) throw ApiError.conflict("players.has_matches");

  await prisma.$transaction(async (tx) => {
    await tx.entry.deleteMany({ where: { OR: [{ player1Id: playerId }, { player2Id: playerId }] } });
    await tx.player.delete({ where: { id: playerId } });
    await writeAudit(tx, {
      actorId: actor.user.id,
      action: "players.delete",
      targetType: "player",
      targetId: playerId,
      before: { name: player.name },
    });
  });
}
