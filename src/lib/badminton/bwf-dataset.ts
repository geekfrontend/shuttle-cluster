import { CATEGORIES, CATEGORY_CODES, type CategoryCode } from "./categories";
import { evaluateMatch, type GameScore, type Gender, isValidSide, MAX_GAMES, type MatchSide } from "./match-rules";

/*
 * Pembaca dataset hasil pertandingan BWF (github.com/SahilMotyar/bwf-match-data): satu baris per
 * pertandingan, kolom `date, discipline, tournament, tier, round, team1, team2, winner, score, …`.
 * Murni (tanpa DB/IO) supaya bisa diuji; script `prisma/import-bwf.ts` yang menulis ke database.
 *
 * Catatan dataset:
 * - pasangan ganda dipisah ` / `; nama kembar diberi akhiran `[player-id]` — nama lengkap dipakai sebagai
 *   ID eksternal pemain;
 * - tidak ada kolom gender: diturunkan dari kategori (MS/MD putra, WS/WD putri; XD dari pasangannya);
 * - retired tidak ditandai: skor yang belum selesai dicatat sebagai retired dengan pemenang dari `winner`;
 * - 2014–2017 ada uji coba format 5×11 poin (4–5 game) yang tidak sesuai aturan 21 poin → dilewati.
 */

export const BWF_COLUMNS = ["date", "discipline", "tournament", "tier", "round", "team1", "team2", "winner", "score"];

/** Satu baris dataset; kolom yang tidak ada di file dianggap kosong. */
export type BwfRow = Partial<Record<string, string>>;

/** Tabel CSV (baris pertama header) → objek per baris. Kolom wajib yang hilang → error. */
export function toBwfRows(table: string[][]): BwfRow[] {
  const [header = [], ...body] = table;
  const columns = header.map((cell) => cell.trim());
  const missing = BWF_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length > 0) throw new Error(`Missing columns: ${missing.join(", ")}`);
  return body.map((cells) => Object.fromEntries(columns.map((column, index) => [column, cells[index]?.trim() ?? ""])));
}

export type BwfMatch = {
  category: CategoryCode;
  playedOn: string;
  tournament: string;
  tier: string | null;
  round: string | null;
  /** Babak kualifikasi (berawalan `Q`). */
  qualification: boolean;
  /** Nama pemain persis seperti di dataset (termasuk akhiran `[id]`), urutan sisi A lalu B. */
  sides: [string[], string[]];
  winner: MatchSide;
  games: GameScore[];
  retired: boolean;
  /** Kunci stabil satu pertandingan (tanpa skor), dasar ID eksternal untuk import ulang. */
  key: string;
};

export type BwfSkipReason =
  | "invalid_row"
  | "experimental_scoring"
  | "invalid_score"
  | "winner_mismatch"
  | "same_player"
  | "unknown_gender"
  | "gender_mismatch";

export type BwfParseResult = { ok: true; match: BwfMatch } | { ok: false; reason: BwfSkipReason };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const GAME = /^(\d{1,2})-(\d{1,2})$/;

/** Sel kosong → `null`. */
const textOrNull = (value: string | undefined) => (value === undefined || value === "" ? null : value);

function isCategoryCode(value: string): value is CategoryCode {
  return (CATEGORY_CODES as readonly string[]).includes(value);
}

/** `21-15 17-21 21-16` → skor per game (sisi A dulu); `null` bila formatnya tidak dikenali. */
export function parseBwfScore(score: string): GameScore[] | null {
  const parts = score.trim().split(/\s+/).filter(Boolean);
  const games: GameScore[] = [];
  for (const part of parts) {
    const match = GAME.exec(part);
    // biome-ignore lint/suspicious/noUnnecessaryConditions: `exec` mengembalikan null bila tidak cocok.
    if (match === null) return null;
    games.push({ scoreA: Number(match[1]), scoreB: Number(match[2]) });
  }
  return games;
}

/**
 * Uji coba format 5×11 poin (2014–2017): lebih dari 3 game, atau ada game yang sudah selesai (selain game
 * terakhir) berakhir di 11–15 poin — di format 21 poin, game yang selesai selalu berakhir di ≥ 21.
 */
function isExperimentalScoring(games: GameScore[]) {
  if (games.length > MAX_GAMES) return true;
  return games.slice(0, -1).some((game) => {
    const high = Math.max(game.scoreA, game.scoreB);
    return high >= 11 && high <= 15;
  });
}

export function parseBwfRow(row: BwfRow): BwfParseResult {
  const discipline = (row.discipline ?? "").toUpperCase();
  const winnerCell = row.winner;
  const playedOn = row.date ?? "";
  if (!DATE.test(playedOn) || !isCategoryCode(discipline) || !row.tournament) {
    return { ok: false, reason: "invalid_row" };
  }
  if (winnerCell !== "1" && winnerCell !== "2") return { ok: false, reason: "invalid_row" };

  const category = CATEGORIES.find((item) => item.code === discipline) ?? CATEGORIES[0];
  const split = (team: string | undefined) => (team ?? "").split(" / ").map((name) => name.trim());
  const sides: [string[], string[]] = [split(row.team1), split(row.team2)];
  if (sides.some((side) => side.length !== category.unitSize || side.some((name) => name === ""))) {
    return { ok: false, reason: "invalid_row" };
  }
  const names = sides.flat();
  if (new Set(names).size !== names.length) return { ok: false, reason: "same_player" };

  const games = parseBwfScore(row.score ?? "");
  if (!games) return { ok: false, reason: "invalid_score" };
  if (isExperimentalScoring(games)) return { ok: false, reason: "experimental_scoring" };

  const winner: MatchSide = winnerCell === "1" ? "a" : "b";
  const finished = evaluateMatch(games);
  let retired = false;
  if (finished.ok) {
    if (finished.winner !== winner) return { ok: false, reason: "winner_mismatch" };
  } else {
    // Hanya skor yang "belum selesai" yang bisa berarti retired; game ketiga setelah 2-0 tetap tidak sah.
    const unfinished = finished.error.code === "game_invalid" || finished.error.code === "too_few_games";
    if (!unfinished || !evaluateMatch(games, { retired: true, winner }).ok) {
      return { ok: false, reason: "invalid_score" };
    }
    retired = true;
  }

  const round = textOrNull(row.round);
  return {
    ok: true,
    match: {
      category: discipline,
      playedOn,
      tournament: row.tournament,
      tier: textOrNull(row.tier),
      round,
      qualification: round?.startsWith("Q") ?? false,
      sides,
      winner,
      games,
      retired,
      key: [playedOn, discipline, row.tournament, round ?? "", row.team1, row.team2].join("|"),
    },
  };
}

/**
 * Nama tampilan: tanpa akhiran pembeda `[player-id]`, dan tanpa `.` / `-` yang dipakai dataset sebagai pengganti
 * nama depan pemain bernama tunggal (`. CAROLINE` → `CAROLINE`).
 */
export function displayName(externalName: string): string {
  return externalName
    .replace(/\s*\[[^\]]*\]$/, "")
    .replace(/^[.-]+\s+/, "")
    .trim();
}

const CATEGORY_GENDER: Partial<Record<CategoryCode, Gender>> = { MS: "male", MD: "male", WS: "female", WD: "female" };

/**
 * Gender per nama pemain. `known` (mis. pemain yang sudah ada di database) selalu menang. Sisanya dari
 * kategori yang dimainkan — bila seorang pemain muncul di nomor putra dan putri (kesalahan data), dipilih
 * yang paling sering dan namanya dilaporkan. Pemain yang hanya bermain XD diturunkan dari pasangannya.
 */
export function inferGenders(matches: BwfMatch[], known: ReadonlyMap<string, Gender> = new Map()) {
  const counts = new Map<string, { male: number; female: number }>();
  for (const match of matches) {
    const gender = CATEGORY_GENDER[match.category];
    if (!gender) continue;
    for (const name of match.sides.flat()) {
      const count = counts.get(name) ?? { male: 0, female: 0 };
      count[gender] += 1;
      counts.set(name, count);
    }
  }

  const genders = new Map(known);
  const conflicts: string[] = [];
  for (const [name, count] of counts) {
    if (count.male > 0 && count.female > 0) conflicts.push(name);
    if (!genders.has(name)) genders.set(name, count.male >= count.female ? "male" : "female");
  }

  // XD: pasangan selalu putra + putri; ulangi sampai tidak ada yang bisa diturunkan lagi.
  const opposite = (gender: Gender): Gender => (gender === "male" ? "female" : "male");
  const pairs = matches.filter((match) => match.category === "XD").flatMap((match) => match.sides);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [first, second] of pairs) {
      if (!first || !second) continue;
      const a = genders.get(first);
      const b = genders.get(second);
      if (a && !b) {
        genders.set(second, opposite(a));
        changed = true;
      } else if (b && !a) {
        genders.set(first, opposite(b));
        changed = true;
      }
    }
  }

  return { genders, conflicts };
}

/** Cek komposisi kedua sisi dengan gender hasil `inferGenders`. */
export function checkSides(match: BwfMatch, genders: ReadonlyMap<string, Gender>): BwfSkipReason | null {
  const category = CATEGORIES.find((item) => item.code === match.category) ?? CATEGORIES[0];
  for (const side of match.sides) {
    const sideGenders = side.map((name) => genders.get(name));
    if (sideGenders.some((gender) => gender === undefined)) return "unknown_gender";
    if (!isValidSide(category, sideGenders as Gender[])) return "gender_mismatch";
  }
  return null;
}
