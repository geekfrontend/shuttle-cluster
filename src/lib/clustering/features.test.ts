import { aggregateUnits, featuresOf, fromVector, toVector } from "./features";
import { describe, expect, test } from "bun:test";

const g = (scoreA: number, scoreB: number) => ({ scoreA, scoreB });

describe("aggregateUnits", () => {
  const units = aggregateUnits([
    { entryAId: "x", entryBId: "y", winner: "a", games: [g(21, 15), g(21, 18)] },
    { entryAId: "y", entryBId: "x", winner: "a", games: [g(21, 19), g(15, 21), g(21, 17)] },
  ]);

  test("counts both sides of every match", () => {
    // x: 21-15, 21-18 (sisi A) lalu 19-21, 21-15, 17-21 (sisi B) → poin 99-90, game 3 dari 5.
    expect(units.get("x")).toEqual({ matches: 2, wins: 1, games: 5, gamesWon: 3, pointsFor: 99, pointsAgainst: 90 });
    expect(units.get("y")).toEqual({ matches: 2, wins: 1, games: 5, gamesWon: 2, pointsFor: 90, pointsAgainst: 99 });
  });

  test("features from the totals", () => {
    const features = featuresOf(
      units.get("x") ?? { matches: 0, wins: 0, games: 0, gamesWon: 0, pointsFor: 0, pointsAgainst: 0 },
    );
    expect(features.winRate).toBe(0.5);
    expect(features.gameWinRate).toBeCloseTo(0.6);
    expect(features.pointDiffPerGame).toBeCloseTo(1.8);
  });
});

test("a unit without games has zero features instead of NaN", () => {
  expect(featuresOf({ matches: 0, wins: 0, games: 0, gamesWon: 0, pointsFor: 0, pointsAgainst: 0 })).toEqual({
    winRate: 0,
    gameWinRate: 0,
    pointDiffPerGame: 0,
  });
});

test("vectors keep the feature order", () => {
  const features = { winRate: 0.7, gameWinRate: 0.6, pointDiffPerGame: 2 };
  expect(toVector(features)).toEqual([0.7, 0.6, 2]);
  expect(fromVector(toVector(features))).toEqual(features);
});
