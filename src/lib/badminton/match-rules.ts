import type { Category, CategoryCode } from "./categories";

/*
 * Aturan pertandingan BWF yang dipakai untuk validasi input dan import. Murni (tanpa DB) supaya bisa
 * diuji dan dipakai ulang oleh server maupun UI.
 */

export type Gender = "male" | "female";
export type MatchSide = "a" | "b";
export type GameScore = { scoreA: number; scoreB: number };

export const MAX_GAMES = 3;
export const MAX_POINTS = 30;

/**
 * Game selesai bila salah satu sisi mencapai 21 dengan selisih ≥ 2; setelah 20-20 menang dengan selisih 2,
 * dan setelah 29-29 poin ke-30 menentukan (30-29).
 */
export function gameWinner({ scoreA, scoreB }: GameScore): MatchSide | null {
  const high = Math.max(scoreA, scoreB);
  const low = Math.min(scoreA, scoreB);
  const finished =
    (high === 21 && low <= 19) || (high > 21 && high <= MAX_POINTS && high - low === 2) || (high === 30 && low === 29);
  if (!finished) return null;
  return scoreA > scoreB ? "a" : "b";
}

const isPoints = (value: number) => Number.isInteger(value) && value >= 0 && value <= MAX_POINTS;

export type MatchScoreError =
  | { code: "game_invalid"; game: number }
  | { code: "too_few_games" }
  | { code: "too_many_games" }
  | { code: "extra_game" }
  | { code: "winner_required" };

export type MatchScoreResult = { ok: true; winner: MatchSide } | { ok: false; error: MatchScoreError };

/**
 * Validasi skor satu pertandingan (best of 3) dan tentukan pemenangnya.
 * - Selesai normal: 2–3 game, semuanya selesai; game 3 hanya bila skor game 1-1.
 * - `retired` (retired/walkover): 0–3 game; game terakhir boleh belum selesai, pemenang wajib diisi.
 */
export function evaluateMatch(
  games: GameScore[],
  options: { retired?: boolean; winner?: MatchSide } = {},
): MatchScoreResult {
  if (games.length > MAX_GAMES) return { ok: false, error: { code: "too_many_games" } };

  for (const [index, game] of games.entries()) {
    if (!isPoints(game.scoreA) || !isPoints(game.scoreB)) {
      return { ok: false, error: { code: "game_invalid", game: index + 1 } };
    }
  }

  if (options.retired) {
    // Semua game sebelum game terakhir harus sudah selesai.
    for (const [index, game] of games.slice(0, -1).entries()) {
      if (!gameWinner(game)) return { ok: false, error: { code: "game_invalid", game: index + 1 } };
    }
    if (!options.winner) return { ok: false, error: { code: "winner_required" } };
    return { ok: true, winner: options.winner };
  }

  if (games.length < 2) return { ok: false, error: { code: "too_few_games" } };

  const won = { a: 0, b: 0 };
  for (const [index, game] of games.entries()) {
    const winner = gameWinner(game);
    if (!winner) return { ok: false, error: { code: "game_invalid", game: index + 1 } };
    // Game 3 tidak dimainkan bila satu sisi sudah menang 2-0.
    if (won.a === 2 || won.b === 2) return { ok: false, error: { code: "extra_game" } };
    won[winner] += 1;
  }

  if (won.a === 2) return { ok: true, winner: "a" };
  if (won.b === 2) return { ok: true, winner: "b" };
  return { ok: false, error: { code: "too_few_games" } };
}

/** Komposisi satu sisi sesuai kategori: jumlah pemain dan gender (XD = 1 putra + 1 putri). */
export function isValidSide(category: Category, genders: Gender[]): boolean {
  if (genders.length !== category.unitSize) return false;
  if (category.gender === "men") return genders.every((gender) => gender === "male");
  if (category.gender === "women") return genders.every((gender) => gender === "female");
  return genders.includes("male") && genders.includes("female");
}

/** Gender yang diharapkan per slot pemain, untuk penyaring pilihan di form. */
export function slotGenders(category: Category): Gender[] {
  if (category.gender === "men") return Array.from({ length: category.unitSize }, () => "male");
  if (category.gender === "women") return Array.from({ length: category.unitSize }, () => "female");
  return ["male", "female"];
}

/** Kunci unik unit: urutan pemain dalam pasangan tidak berpengaruh. */
export function entryKey(code: CategoryCode, playerIds: string[]): string {
  return `${code}:${[...playerIds].sort().join("+")}`;
}
