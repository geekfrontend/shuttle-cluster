import type { CategoryCode, CategoryFormat, ClusterLevel } from "@/lib/badminton/categories";

// Kategori pertandingan dan tingkat performa hasil clustering.
export const en = {
  categories: {
    MS: { name: "Men's singles", term: "Men's singles", unit: "1 player" },
    WS: { name: "Women's singles", term: "Women's singles", unit: "1 player" },
    MD: { name: "Men's doubles", term: "Men's doubles", unit: "Pair of 2 men" },
    WD: { name: "Women's doubles", term: "Women's doubles", unit: "Pair of 2 women" },
    XD: { name: "Mixed doubles", term: "Mixed doubles", unit: "Pair of 1 man + 1 woman" },
  } satisfies Record<CategoryCode, { name: string; term: string; unit: string }>,
  /** Sebutan unit yang dikelompokkan, untuk jumlah anggota cluster. */
  entities: { singles: "players", doubles: "pairs" } satisfies Record<CategoryFormat, string>,
  levels: {
    dominant: {
      name: "Dominant",
      tier: "High",
      description: "The strongest match performance in this category.",
    },
    competitive: {
      name: "Competitive",
      tier: "Medium",
      description: "Close contests; results can go either way.",
    },
    developing: {
      name: "Developing",
      tier: "Low",
      description: "Performance is still below average and has room to grow.",
    },
  } satisfies Record<ClusterLevel, { name: string; tier: string; description: string }>,
  overview: {
    metaTitle: "Categories",
    title: "Categories",
    description: "Clustering runs separately for each category. Choose a category to see its results.",
    columns: { code: "Code", category: "Category", unit: "Competing unit", status: "Status" },
    noData: "No data yet",
    open: "Open {category}",
  },
  detail: {
    back: "All categories",
    unit: "Competing unit: {unit}",
    levelsTitle: "Performance levels",
    levelsDescription: "K-Means with 3 clusters, ranked from the highest-performing centroid.",
    noResult: "No result yet",
    emptyTitle: "No match data yet",
    emptyDescription: "Import {category} match results to run the clustering. Import is coming soon.",
  },
};

export type ClusteringMessages = typeof en;
