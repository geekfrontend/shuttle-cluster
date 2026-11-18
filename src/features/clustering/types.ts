import type { CategoryCode } from "@/lib/badminton/categories";
import type { NormalizeMethod } from "@/lib/clustering/kmeans";
import type { ClusteringResponse } from "@/server/services/clustering.service";

export type ClusteringRequest = {
  category: CategoryCode;
  /** `YYYY-MM-DD`; kosong = 24 bulan terakhir data kategori. */
  from?: string;
  to?: string;
  mainDraw: boolean;
  /** Level turnamen minimum 1–5. */
  minTier: number;
  minMatches: number;
  normalization: NormalizeMethod;
};

/** Filter yang bisa diubah pengguna (tanpa kategori). */
export type ClusteringFilters = Omit<ClusteringRequest, "category">;

/** Filter awal halaman kategori: 24 bulan terakhir data (periode kosong), main draw, semua level, ≥ 10 pertandingan. */
export const DEFAULT_CLUSTERING_FILTERS: ClusteringFilters = {
  mainDraw: true,
  minTier: 1,
  minMatches: 10,
  normalization: "zscore",
};

/** Respons `GET /api/clustering` (bentuknya mengikuti service supaya selalu sinkron). */
export type ClusteringResult = ClusteringResponse;

export type ClusteringOutput = NonNullable<ClusteringResult["result"]>;
export type ClusterMember = ClusteringOutput["members"][number];
export type ClusterSummary = ClusteringOutput["clusters"][number];
