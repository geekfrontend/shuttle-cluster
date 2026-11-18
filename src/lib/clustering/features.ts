import type { GameScore, MatchSide } from "@/lib/badminton/match-rules";

/*
 * Ekstraksi fitur performa per unit (pemain tunggal / pasangan) dari hasil pertandingan. Murni (tanpa DB)
 * supaya bisa diuji; `clustering.service.ts` yang mengambil data dan menjalankan K-Means.
 *
 * Pertandingan retired/walkover sebaiknya tidak dimasukkan: skornya tidak lengkap dan tidak mencerminkan
 * performa penuh (penyaringan dilakukan pemanggil).
 */

export type FeatureMatch = {
  entryAId: string;
  entryBId: string;
  winner: MatchSide;
  games: GameScore[];
};

/** Rekap mentah satu unit. */
export type UnitStats = {
  matches: number;
  wins: number;
  games: number;
  gamesWon: number;
  pointsFor: number;
  pointsAgainst: number;
};

export const FEATURE_KEYS = ["winRate", "gameWinRate", "pointDiffPerGame"] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export type UnitFeatures = Record<FeatureKey, number>;

/**
 * - `winRate`: pertandingan dimenangi ÷ dimainkan (0–1).
 * - `gameWinRate`: game dimenangi ÷ game dimainkan (0–1).
 * - `pointDiffPerGame`: (poin didapat − poin lawan) ÷ game dimainkan — seberapa telak menang/kalah.
 */
export function featuresOf(stats: UnitStats): UnitFeatures {
  return {
    winRate: stats.matches === 0 ? 0 : stats.wins / stats.matches,
    gameWinRate: stats.games === 0 ? 0 : stats.gamesWon / stats.games,
    pointDiffPerGame: stats.games === 0 ? 0 : (stats.pointsFor - stats.pointsAgainst) / stats.games,
  };
}

export function toVector(features: UnitFeatures): number[] {
  return FEATURE_KEYS.map((key) => features[key]);
}

export function fromVector(vector: readonly number[]): UnitFeatures {
  return Object.fromEntries(FEATURE_KEYS.map((key, index) => [key, vector[index] ?? 0])) as UnitFeatures;
}

const emptyStats = (): UnitStats => ({ matches: 0, wins: 0, games: 0, gamesWon: 0, pointsFor: 0, pointsAgainst: 0 });

/** Rekap tiap unit dari kedua sisi setiap pertandingan. */
export function aggregateUnits(matches: readonly FeatureMatch[]): Map<string, UnitStats> {
  const units = new Map<string, UnitStats>();
  const add = (entryId: string, won: boolean, games: { own: number; opponent: number }[]) => {
    const stats = units.get(entryId) ?? emptyStats();
    stats.matches += 1;
    if (won) stats.wins += 1;
    for (const game of games) {
      stats.games += 1;
      if (game.own > game.opponent) stats.gamesWon += 1;
      stats.pointsFor += game.own;
      stats.pointsAgainst += game.opponent;
    }
    units.set(entryId, stats);
  };

  for (const match of matches) {
    add(
      match.entryAId,
      match.winner === "a",
      match.games.map((game) => ({ own: game.scoreA, opponent: game.scoreB })),
    );
    add(
      match.entryBId,
      match.winner === "b",
      match.games.map((game) => ({ own: game.scoreB, opponent: game.scoreA })),
    );
  }
  return units;
}
