import {
  denormalize,
  evaluateK,
  kmeans,
  normalize,
  rankClusters,
  silhouette,
  silhouetteDetails,
  squaredDistance,
} from "./kmeans";
import { describe, expect, test } from "bun:test";

/** Tiga kelompok yang jelas terpisah: rendah, sedang, tinggi. */
const POINTS = [
  [0.1, 0.2],
  [0.15, 0.1],
  [0.2, 0.15],
  [0.5, 0.5],
  [0.55, 0.45],
  [0.45, 0.55],
  [0.9, 0.85],
  [0.85, 0.9],
  [0.95, 0.95],
];

describe("normalize", () => {
  test("z-score gives mean 0 and standard deviation 1 per feature", () => {
    const { values } = normalize([[1], [2], [3]], "zscore");
    const column = values.map((row) => row[0] ?? 0);
    expect(column.reduce((a, b) => a + b, 0)).toBeCloseTo(0);
    expect(Math.sqrt(column.reduce((a, b) => a + b * b, 0) / column.length)).toBeCloseTo(1);
  });

  test("min-max scales to 0..1", () => {
    expect(normalize([[10], [15], [20]], "minmax").values).toEqual([[0], [0.5], [1]]);
  });

  test("a constant feature becomes 0 instead of NaN", () => {
    expect(normalize([[5], [5]], "zscore").values).toEqual([[0], [0]]);
    expect(normalize([[5], [5]], "minmax").values).toEqual([[0], [0]]);
  });

  test("denormalize restores original units", () => {
    for (const method of ["zscore", "minmax"] as const) {
      const { values, stats } = normalize(POINTS, method);
      for (const [j, value] of denormalize(values[4] ?? [], stats).entries()) {
        expect(value).toBeCloseTo(POINTS[4]?.[j] ?? 0);
      }
    }
  });

  test("rejects ragged or non-numeric input", () => {
    expect(() => normalize([[1, 2], [3]])).toThrow();
    expect(() => normalize([[Number.NaN]])).toThrow();
  });
});

describe("kmeans", () => {
  test("finds well-separated groups", () => {
    const result = kmeans(POINTS, 3);
    expect([...result.sizes].sort()).toEqual([3, 3, 3]);
    // Titik dalam satu kelompok asli berada di cluster yang sama.
    for (const group of [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
    ]) {
      expect(new Set(group.map((i) => result.labels[i])).size).toBe(1);
    }
  });

  test("is deterministic for the same seed", () => {
    expect(kmeans(POINTS, 3, { seed: 7 })).toEqual(kmeans(POINTS, 3, { seed: 7 }));
  });

  test("WCSS equals the sum of squared distances to the assigned centroid", () => {
    const result = kmeans(POINTS, 3);
    const wcss = POINTS.reduce(
      (sum, point, i) => sum + squaredDistance(point, result.centroids[result.labels[i] ?? 0] ?? []),
      0,
    );
    expect(result.wcss).toBeCloseTo(wcss);
  });

  test("trace keeps the initial centroids and every iteration", () => {
    const result = kmeans(POINTS, 3, { trace: true });
    expect(result.history).toHaveLength(result.iterations + 1);
    expect(result.history?.at(-1)).toEqual(result.centroids);
  });

  test("handles duplicate points without empty clusters crashing", () => {
    const result = kmeans(
      [
        [1, 1],
        [1, 1],
        [1, 1],
      ],
      2,
    );
    expect(result.labels).toHaveLength(3);
    expect(result.wcss).toBe(0);
  });

  test("validates k", () => {
    expect(() => kmeans(POINTS, 0)).toThrow();
    expect(() => kmeans(POINTS, 2.5)).toThrow();
    expect(() => kmeans(POINTS.slice(0, 2), 3)).toThrow();
  });
});

describe("silhouette and evaluateK", () => {
  test("clear clusters score close to 1, a single cluster scores 0", () => {
    const result = kmeans(POINTS, 3);
    expect(silhouette(POINTS, result.labels)).toBeGreaterThan(0.7);
    expect(
      silhouette(
        POINTS,
        POINTS.map(() => 0),
      ),
    ).toBe(0);
  });

  test("silhouette details expose a, b and the nearest other cluster", () => {
    const labels = [0, 0, 1, 1];
    const points = [[0], [1], [10], [11]];
    const [first] = silhouetteDetails(points, labels);
    expect(first?.a).toBe(1); // jarak ke [1]
    expect(first?.b).toBe(10.5); // rata-rata jarak ke [10] dan [11]
    expect(first?.neighbor).toBe(1);
    expect(first?.silhouette).toBeCloseTo((10.5 - 1) / 10.5);
  });

  test("WCSS decreases as k grows and k = 3 has the best silhouette here", () => {
    const scores = evaluateK(POINTS, [1, 2, 3, 4]);
    expect(scores.map((score) => score.k)).toEqual([1, 2, 3, 4]);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]?.wcss ?? 0).toBeLessThanOrEqual(scores[i - 1]?.wcss ?? 0);
    }
    const best = scores.slice(1).reduce((a, b) => (b.silhouette > a.silhouette ? b : a));
    expect(best.k).toBe(3);
  });
});

describe("rankClusters", () => {
  test("cluster 0 has the highest centroid score and labels follow", () => {
    const ranked = rankClusters(kmeans(POINTS, 3));
    const scores = ranked.centroids.map((c) => c.reduce((a, b) => a + b, 0));
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(ranked.labels[8]).toBe(0); // kelompok tinggi
    expect(ranked.labels[0]).toBe(2); // kelompok rendah
  });

  test("negative weights flip a feature where lower is better", () => {
    const ranked = rankClusters(kmeans(POINTS, 3), [-1, -1]);
    expect(ranked.labels[0]).toBe(0);
  });
});
