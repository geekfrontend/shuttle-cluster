/**
 * Lima kategori (nomor) pertandingan bulu tangkis BWF. Clustering selalu dijalankan per kategori —
 * skala performa tunggal dan ganda, juga putra dan putri, tidak dicampur. Di ganda, unit yang
 * dikelompokkan adalah pasangan, bukan pemain perorangan.
 *
 * Murni (tanpa React/DB) supaya bisa dipakai UI, API, dan seed. Label tampilan ada di
 * `clusteringMessages`.
 */
export const CATEGORY_CODES = ["MS", "WS", "MD", "WD", "XD"] as const;

export type CategoryCode = (typeof CATEGORY_CODES)[number];

export type CategoryFormat = "singles" | "doubles";

export type Category = {
  code: CategoryCode;
  format: CategoryFormat;
  gender: "men" | "women" | "mixed";
  /** Jumlah pemain dalam satu unit yang bertanding. */
  unitSize: 1 | 2;
};

export const CATEGORIES: readonly Category[] = [
  { code: "MS", format: "singles", gender: "men", unitSize: 1 },
  { code: "WS", format: "singles", gender: "women", unitSize: 1 },
  { code: "MD", format: "doubles", gender: "men", unitSize: 2 },
  { code: "WD", format: "doubles", gender: "women", unitSize: 2 },
  { code: "XD", format: "doubles", gender: "mixed", unitSize: 2 },
];

/** Segmen URL kategori, mis. `/categories/ms`. */
export function categorySlug(code: CategoryCode): string {
  return code.toLowerCase();
}

export function categoryFromSlug(slug: string): Category | undefined {
  return CATEGORIES.find((category) => categorySlug(category.code) === slug.toLowerCase());
}

/** Tiga tingkat hasil K-Means (K = 3), urut dari centroid performa tertinggi. */
export const CLUSTER_LEVELS = ["dominant", "competitive", "developing"] as const;

export type ClusterLevel = (typeof CLUSTER_LEVELS)[number];
