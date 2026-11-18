import { prisma } from "@/db/client";
import type { Category, Prisma } from "@/generated/prisma/client";
import { CLUSTER_LEVELS } from "@/lib/badminton/categories";
import { tierLevel } from "@/lib/badminton/tiers";
import {
  aggregateUnits,
  FEATURE_KEYS,
  type FeatureMatch,
  featuresOf,
  fromVector,
  toVector,
} from "@/lib/clustering/features";
import {
  denormalize,
  evaluateK,
  kmeans,
  type NormalizeMethod,
  normalize,
  rankClusters,
  silhouetteDetails,
  squaredDistance,
} from "@/lib/clustering/kmeans";
import { type DataRange, defaultPeriod } from "@/lib/clustering/period";

/** K tetap 3: Dominan, Kompetitif, Berkembang (lihat docs/project.md). K lain hanya untuk grafik Elbow/Silhouette. */
const K = CLUSTER_LEVELS.length;
const EVALUATED_KS = [1, 2, 3, 4, 5, 6];
/** Seed tetap supaya hasil yang sama bisa ditampilkan ulang dan dikutip di laporan. */
const SEED = 42;
const RESTARTS = 20;

export type ClusteringParams = {
  category: Category;
  from?: string;
  to?: string;
  mainDraw: boolean;
  minTier: number;
  minMatches: number;
  normalization: NormalizeMethod;
};

const iso = (date: Date) => date.toISOString().slice(0, 10);

/** Rentang tanggal pertandingan (selesai normal) yang ada di kategori ini, atau `null` bila belum ada data. */
async function dataRange(category: Category): Promise<DataRange | null> {
  const range = await prisma.match.aggregate({
    where: { category, retired: false },
    _min: { playedOn: true },
    _max: { playedOn: true },
  });
  if (!range._min.playedOn || !range._max.playedOn) return null;
  return { first: iso(range._min.playedOn), last: iso(range._max.playedOn) };
}

/** Label `tier` di kategori ini yang levelnya ≥ `minTier` (tier tak dikenal ikut hanya bila `minTier` = 1). */
async function allowedTiers(category: Category, minTier: number) {
  const tiers = await prisma.match.groupBy({ by: ["tier"], where: { category } });
  return tiers
    .map((row) => row.tier)
    .filter((tier): tier is string => tier !== null && (tierLevel(tier) ?? 0) >= minTier);
}

const playerRef = { select: { id: true, name: true, country: true } } as const;

/**
 * Jalankan clustering satu kategori: ambil pertandingan di periode & level turnamen yang dipilih, hitung fitur
 * per unit (pemain tunggal / pasangan), normalisasi, K-Means K = 3, lalu urutkan cluster dari centroid
 * tertinggi. Pertandingan retired/walkover tidak dihitung. Unit dengan pertandingan < `minMatches` dilewati.
 */
export async function runClustering(params: ClusteringParams) {
  const range = await dataRange(params.category);
  const fallback = range ? defaultPeriod(range) : null;
  const period = { from: params.from ?? fallback?.from ?? null, to: params.to ?? fallback?.to ?? null };

  const where: Prisma.MatchWhereInput = {
    category: params.category,
    retired: false,
    ...(period.from || period.to
      ? {
          playedOn: {
            ...(period.from ? { gte: new Date(`${period.from}T00:00:00.000Z`) } : {}),
            ...(period.to ? { lte: new Date(`${period.to}T00:00:00.000Z`) } : {}),
          },
        }
      : {}),
    // Round kosong (mis. dicatat manual) dianggap main draw.
    ...(params.mainDraw ? { OR: [{ round: null }, { NOT: { round: { startsWith: "Q" } } }] } : {}),
    ...(params.minTier > 1 ? { tier: { in: await allowedTiers(params.category, params.minTier) } } : {}),
  };

  const rows = await prisma.match.findMany({
    where,
    select: {
      entryAId: true,
      entryBId: true,
      winner: true,
      games: { select: { scoreA: true, scoreB: true }, orderBy: { number: "asc" } },
    },
  });
  const units = aggregateUnits(rows satisfies FeatureMatch[]);
  const eligible = [...units].filter(([, stats]) => stats.matches >= params.minMatches);

  const summary = { matches: rows.length, units: units.size, eligibleUnits: eligible.length };
  const base = {
    params: { ...params, ...period, k: K },
    dataRange: range,
    summary,
    features: FEATURE_KEYS,
  };
  // Butuh minimal K unit; tanpa itu hasil dikembalikan kosong supaya UI bisa menyarankan filter lain.
  if (eligible.length < K) return { ...base, result: null };

  const vectors = eligible.map(([, stats]) => toVector(featuresOf(stats)));
  const { values, stats: scaling } = normalize(vectors, params.normalization);
  const clustered = rankClusters(kmeans(values, K, { seed: SEED, restarts: RESTARTS, trace: true }));
  const details = silhouetteDetails(values, clustered.labels);
  const silhouettes = details.map((detail) => detail.silhouette);
  const evaluation = evaluateK(values, EVALUATED_KS, { seed: SEED, restarts: RESTARTS });

  const entries = await prisma.entry.findMany({
    where: { id: { in: eligible.map(([id]) => id) } },
    select: { id: true, player1: playerRef, player2: playerRef },
  });
  const playersOf = new Map(
    entries.map((entry) => [entry.id, entry.player2 ? [entry.player1, entry.player2] : [entry.player1]]),
  );

  const levelOf = (cluster: number) => CLUSTER_LEVELS[cluster] ?? CLUSTER_LEVELS[CLUSTER_LEVELS.length - 1];
  const members = eligible
    .map(([entryId, stats], index) => {
      const cluster = clustered.labels[index] ?? 0;
      const normalized = values[index] ?? [];
      const detail = details[index];
      return {
        entryId,
        players: playersOf.get(entryId) ?? [],
        level: levelOf(cluster),
        stats,
        features: featuresOf(stats),
        /** Vektor fitur setelah normalisasi (urutan `features`). */
        normalized,
        /** Jarak Euclidean ke centroid tiap cluster (urutan `clusters`); unit masuk ke cluster terdekat. */
        distances: clustered.centroids.map((centroid) => Math.sqrt(squaredDistance(normalized, centroid))),
        silhouette: detail?.silhouette ?? 0,
        /** Komponen silhouette: a = rata-rata jarak ke cluster sendiri, b = ke cluster tetangga terdekat. */
        silhouetteA: detail?.a ?? 0,
        silhouetteB: detail?.b ?? 0,
        neighbor: detail?.neighbor === null || detail?.neighbor === undefined ? null : levelOf(detail.neighbor),
      };
    })
    .sort(
      (a, b) =>
        CLUSTER_LEVELS.indexOf(a.level) - CLUSTER_LEVELS.indexOf(b.level) ||
        b.features.winRate - a.features.winRate ||
        b.stats.matches - a.stats.matches,
    );

  const silhouetteOf = (cluster: number) => {
    const values = silhouettes.filter((_, index) => clustered.labels[index] === cluster);
    return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  return {
    ...base,
    result: {
      clusters: clustered.centroids.map((centroid, cluster) => ({
        level: levelOf(cluster),
        size: clustered.sizes[cluster] ?? 0,
        /** Centroid dalam satuan asli fitur (mis. win rate 0–1). */
        centroid: fromVector(denormalize(centroid, scaling)),
        /** Centroid di ruang ternormalisasi — dasar urutan Dominan → Berkembang. */
        normalizedCentroid: centroid,
        silhouette: silhouetteOf(cluster),
      })),
      members,
      quality: {
        wcss: clustered.wcss,
        silhouette: silhouettes.reduce((sum, value) => sum + value, 0) / silhouettes.length,
        iterations: clustered.iterations,
      },
      normalization: scaling,
      /** WCSS & silhouette untuk K = 1…6 (grafik Elbow & Silhouette). */
      evaluation,
      /** Centroid (satuan asli) dari inisialisasi sampai konvergen, urutan cluster sama dengan `clusters`. */
      history: (clustered.history ?? []).map((step) =>
        step.map((centroid) => fromVector(denormalize(centroid, scaling))),
      ),
      seed: SEED,
      restarts: RESTARTS,
    },
  };
}

export type ClusteringResponse = Awaited<ReturnType<typeof runClustering>>;
