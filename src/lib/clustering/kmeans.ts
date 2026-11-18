/*
 * K-Means clustering untuk mengelompokkan unit (pemain tunggal / pasangan) berdasarkan fitur performa.
 * Murni (tanpa DB/React) dan deterministik — seed yang sama selalu memberi hasil yang sama — supaya bisa
 * diuji dan langkahnya bisa ditampilkan ulang (normalisasi, iterasi centroid, WCSS, silhouette).
 *
 * Alur pemakaian:
 *   const { values, stats } = normalize(rows, "zscore");
 *   const result = rankClusters(kmeans(values, 3, { seed: 42 }));   // cluster 0 = skor centroid tertinggi
 *   const centroids = result.centroids.map((c) => denormalize(c, stats));
 */

export type Point = readonly number[];

// ─── Normalisasi ────────────────────────────────────────────────────────────

export type NormalizeMethod = "zscore" | "minmax";

/** Parameter normalisasi per fitur, untuk mengembalikan centroid ke satuan asli. */
export type NormalizeStats =
  | { method: "zscore"; mean: number[]; sd: number[] }
  | { method: "minmax"; min: number[]; max: number[] };

function assertMatrix(points: readonly Point[]): number {
  const dimensions = points[0]?.length ?? 0;
  if (dimensions === 0) throw new Error("Points must have at least one feature");
  for (const point of points) {
    if (point.length !== dimensions) throw new Error("All points must have the same number of features");
    if (point.some((value) => !Number.isFinite(value))) throw new Error("Feature values must be finite numbers");
  }
  return dimensions;
}

/**
 * Samakan skala fitur supaya tidak ada fitur yang mendominasi jarak (mis. win rate 0–1 vs selisih poin ±5).
 * - `zscore`: (x − rata-rata) / simpangan baku populasi.
 * - `minmax`: (x − min) / (max − min), hasil 0–1.
 * Fitur yang nilainya sama semua (simpangan/rentang 0) menjadi 0.
 */
export function normalize(points: readonly Point[], method: NormalizeMethod = "zscore") {
  if (points.length === 0) throw new Error("No points to normalize");
  const dimensions = assertMatrix(points);
  const column = (j: number) => points.map((point) => point[j] ?? 0);

  if (method === "minmax") {
    const min = Array.from({ length: dimensions }, (_, j) => Math.min(...column(j)));
    const max = Array.from({ length: dimensions }, (_, j) => Math.max(...column(j)));
    const values = points.map((point) =>
      point.map((value, j) => {
        const range = (max[j] ?? 0) - (min[j] ?? 0);
        return range === 0 ? 0 : (value - (min[j] ?? 0)) / range;
      }),
    );
    return { values, stats: { method, min, max } satisfies NormalizeStats };
  }

  const mean = Array.from(
    { length: dimensions },
    (_, j) => column(j).reduce((sum, value) => sum + value, 0) / points.length,
  );
  const sd = Array.from({ length: dimensions }, (_, j) =>
    Math.sqrt(column(j).reduce((sum, value) => sum + (value - (mean[j] ?? 0)) ** 2, 0) / points.length),
  );
  const values = points.map((point) =>
    point.map((value, j) => ((sd[j] ?? 0) === 0 ? 0 : (value - (mean[j] ?? 0)) / (sd[j] ?? 1))),
  );
  return { values, stats: { method, mean, sd } satisfies NormalizeStats };
}

/** Kebalikan `normalize`: titik/centroid ternormalisasi → satuan asli fitur. */
export function denormalize(point: Point, stats: NormalizeStats): number[] {
  if (stats.method === "minmax") {
    return point.map((value, j) => (stats.min[j] ?? 0) + value * ((stats.max[j] ?? 0) - (stats.min[j] ?? 0)));
  }
  return point.map((value, j) => (stats.mean[j] ?? 0) + value * (stats.sd[j] ?? 0));
}

// ─── K-Means ────────────────────────────────────────────────────────────────

export type KMeansOptions = {
  /** Seed bilangan acak untuk inisialisasi k-means++. Default 42. */
  seed?: number;
  /** Berapa kali K-Means diulang dengan inisialisasi berbeda; hasil dengan WCSS terkecil yang dipakai. Default 20. */
  restarts?: number;
  /** Batas iterasi per percobaan. Default 100. */
  maxIterations?: number;
  /** Simpan centroid tiap iterasi dari percobaan terbaik (untuk menampilkan langkah perhitungan). */
  trace?: boolean;
};

export type KMeansResult = {
  k: number;
  /** Cluster tiap titik (0 … k−1), urut sama dengan input. */
  labels: number[];
  /** Centroid tiap cluster dalam ruang fitur input (ternormalisasi bila input dinormalisasi). */
  centroids: number[][];
  /** Jumlah anggota tiap cluster. */
  sizes: number[];
  /** Within-cluster sum of squares: total jarak kuadrat titik ke centroid-nya. Dasar metode Elbow. */
  wcss: number;
  /** Jumlah iterasi sampai konvergen pada percobaan terbaik. */
  iterations: number;
  /** Centroid awal lalu centroid setelah tiap iterasi (hanya bila `trace: true`). */
  history?: number[][][];
};

/** Mulberry32: PRNG kecil dan cepat; cukup untuk inisialisasi yang bisa diulang. */
function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Jarak Euclidean kuadrat. */
export function squaredDistance(a: Point, b: Point): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += ((a[i] ?? 0) - (b[i] ?? 0)) ** 2;
  return sum;
}

function nearest(point: Point, centroids: readonly Point[]): { index: number; distance: number } {
  let index = 0;
  let distance = Number.POSITIVE_INFINITY;
  for (const [i, centroid] of centroids.entries()) {
    const d = squaredDistance(point, centroid);
    if (d < distance) {
      distance = d;
      index = i;
    }
  }
  return { index, distance };
}

/** k-means++: centroid pertama acak, berikutnya dipilih dengan peluang sebanding jarak kuadrat ke centroid terdekat. */
function initCentroids(points: readonly Point[], k: number, random: () => number): number[][] {
  const first = points[Math.floor(random() * points.length)] ?? points[0] ?? [];
  const centroids = [[...first]];
  while (centroids.length < k) {
    const distances = points.map((point) => nearest(point, centroids).distance);
    const total = distances.reduce((sum, d) => sum + d, 0);
    // Semua titik sudah berimpit dengan centroid (data kembar): ambil titik berikutnya saja.
    if (total === 0) {
      centroids.push([...(points[centroids.length % points.length] ?? first)]);
      continue;
    }
    let target = random() * total;
    let chosen = points.length - 1;
    for (const [i, d] of distances.entries()) {
      target -= d;
      if (target <= 0) {
        chosen = i;
        break;
      }
    }
    centroids.push([...(points[chosen] ?? first)]);
  }
  return centroids;
}

function runOnce(points: readonly Point[], k: number, random: () => number, maxIterations: number, trace: boolean) {
  const dimensions = points[0]?.length ?? 0;
  let centroids = initCentroids(points, k, random);
  const history = trace ? [centroids.map((c) => [...c])] : undefined;
  let labels = points.map((point) => nearest(point, centroids).index);
  let iterations = 0;

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    iterations = iteration;
    // Update: centroid = rata-rata anggota cluster.
    const sums = Array.from({ length: k }, () => new Array<number>(dimensions).fill(0));
    const counts = new Array<number>(k).fill(0);
    for (const [i, point] of points.entries()) {
      const label = labels[i] ?? 0;
      counts[label] = (counts[label] ?? 0) + 1;
      const sum = sums[label];
      if (sum) for (let j = 0; j < dimensions; j++) sum[j] = (sum[j] ?? 0) + (point[j] ?? 0);
    }
    centroids = sums.map((sum, c) => {
      const count = counts[c] ?? 0;
      if (count > 0) return sum.map((value) => value / count);
      // Cluster kosong: pindahkan centroid ke titik yang paling jauh dari centroid-nya saat ini.
      let farthest = 0;
      let farthestDistance = -1;
      for (const [i, point] of points.entries()) {
        const d = squaredDistance(point, centroids[labels[i] ?? 0] ?? point);
        if (d > farthestDistance) {
          farthestDistance = d;
          farthest = i;
        }
      }
      return [...(points[farthest] ?? sum)];
    });
    history?.push(centroids.map((c) => [...c]));

    // Assignment: tiap titik ke centroid terdekat. Konvergen bila tidak ada titik yang pindah cluster.
    const next = points.map((point) => nearest(point, centroids).index);
    const changed = next.some((label, i) => label !== labels[i]);
    labels = next;
    if (!changed) break;
  }

  const wcss = points.reduce((sum, point, i) => sum + squaredDistance(point, centroids[labels[i] ?? 0] ?? point), 0);
  return { labels, centroids, wcss, iterations, history };
}

/**
 * K-Means (algoritma Lloyd) dengan inisialisasi k-means++. Dijalankan `restarts` kali dengan seed turunan,
 * lalu dipilih hasil dengan WCSS terkecil.
 */
export function kmeans(points: readonly Point[], k: number, options: KMeansOptions = {}): KMeansResult {
  const { seed = 42, restarts = 20, maxIterations = 100, trace = false } = options;
  if (!Number.isInteger(k) || k < 1) throw new Error("k must be a positive integer");
  if (points.length < k) throw new Error(`Need at least ${k} points for k = ${k}`);
  assertMatrix(points);

  const random = createRandom(seed);
  let best: ReturnType<typeof runOnce> | null = null;
  for (let run = 0; run < Math.max(1, restarts); run++) {
    const result = runOnce(points, k, random, maxIterations, trace);
    if (!best || result.wcss < best.wcss) best = result;
  }
  if (!best) throw new Error("K-Means did not run");

  const sizes = new Array<number>(k).fill(0);
  for (const label of best.labels) sizes[label] = (sizes[label] ?? 0) + 1;
  return {
    k,
    labels: best.labels,
    centroids: best.centroids,
    sizes,
    wcss: best.wcss,
    iterations: best.iterations,
    ...(best.history ? { history: best.history } : {}),
  };
}

// ─── Evaluasi ───────────────────────────────────────────────────────────────

export type SilhouetteDetail = {
  /** Rata-rata jarak ke anggota lain di cluster sendiri. */
  a: number;
  /** Rata-rata jarak terkecil ke anggota cluster lain (cluster tetangga terdekat). */
  b: number;
  /** Cluster tetangga terdekat (asal nilai `b`), atau `null` bila hanya ada satu cluster. */
  neighbor: number | null;
  silhouette: number;
};

/**
 * Silhouette per titik dengan komponennya: s = (b − a) / max(a, b), dengan a = rata-rata jarak ke anggota
 * cluster sendiri dan b = rata-rata jarak terkecil ke cluster lain. Titik di cluster beranggota satu bernilai 0.
 * Rentang −1 … 1; makin tinggi makin jelas pemisahan cluster.
 */
export function silhouetteDetails(points: readonly Point[], labels: readonly number[]): SilhouetteDetail[] {
  const clusters = new Set(labels);
  if (clusters.size < 2) return points.map(() => ({ a: 0, b: 0, neighbor: null, silhouette: 0 }));

  return points.map((point, i) => {
    const own = labels[i];
    const totals = new Map<number, { sum: number; count: number }>();
    for (const [j, other] of points.entries()) {
      if (j === i) continue;
      const label = labels[j] ?? 0;
      const entry = totals.get(label) ?? { sum: 0, count: 0 };
      entry.sum += Math.sqrt(squaredDistance(point, other));
      entry.count += 1;
      totals.set(label, entry);
    }
    let b = Number.POSITIVE_INFINITY;
    let neighbor: number | null = null;
    for (const [label, entry] of totals) {
      if (label !== own && entry.count > 0 && entry.sum / entry.count < b) {
        b = entry.sum / entry.count;
        neighbor = label;
      }
    }
    const ownTotal = own === undefined ? undefined : totals.get(own);
    if (!ownTotal || ownTotal.count === 0 || !Number.isFinite(b)) {
      return { a: 0, b: Number.isFinite(b) ? b : 0, neighbor, silhouette: 0 };
    }
    const a = ownTotal.sum / ownTotal.count;
    const denominator = Math.max(a, b);
    return { a, b, neighbor, silhouette: denominator === 0 ? 0 : (b - a) / denominator };
  });
}

/** Silhouette per titik (tanpa komponen a/b). */
export function silhouetteSamples(points: readonly Point[], labels: readonly number[]): number[] {
  return silhouetteDetails(points, labels).map((detail) => detail.silhouette);
}

/** Rata-rata silhouette seluruh titik. */
export function silhouette(points: readonly Point[], labels: readonly number[]): number {
  if (points.length === 0) return 0;
  const samples = silhouetteSamples(points, labels);
  return samples.reduce((sum, value) => sum + value, 0) / samples.length;
}

/** WCSS dan silhouette untuk beberapa nilai K — data grafik Elbow & Silhouette sebagai dasar pemilihan K. */
export function evaluateK(
  points: readonly Point[],
  ks: readonly number[],
  options: Omit<KMeansOptions, "trace"> = {},
): { k: number; wcss: number; silhouette: number }[] {
  return ks
    .filter((k) => k >= 1 && k <= points.length)
    .map((k) => {
      const result = kmeans(points, k, options);
      return { k, wcss: result.wcss, silhouette: k === 1 ? 0 : silhouette(points, result.labels) };
    });
}

/**
 * Urutkan cluster dari skor centroid tertinggi: cluster 0 = performa tertinggi (mis. Dominan), dst.
 * Skor = jumlah nilai centroid × bobot fitur (default 1; pakai bobot negatif untuk fitur yang makin kecil makin
 * baik). Gunakan pada centroid ternormalisasi supaya tiap fitur sebanding.
 */
export function rankClusters(result: KMeansResult, weights?: readonly number[]): KMeansResult {
  const score = (centroid: readonly number[]) =>
    centroid.reduce((sum, value, j) => sum + value * (weights?.[j] ?? 1), 0);
  const order = result.centroids.map((centroid, index) => ({ index, score: score(centroid) }));
  order.sort((a, b) => b.score - a.score);
  // `rank[lama] = baru`
  const rank = new Array<number>(result.k).fill(0);
  for (const [position, { index }] of order.entries()) rank[index] = position;

  const remap = (cluster: number) => rank[cluster] ?? cluster;
  return {
    ...result,
    labels: result.labels.map(remap),
    centroids: order.map(({ index }) => result.centroids[index] ?? []),
    sizes: order.map(({ index }) => result.sizes[index] ?? 0),
    ...(result.history ? { history: result.history.map((step) => order.map(({ index }) => step[index] ?? [])) } : {}),
  };
}
