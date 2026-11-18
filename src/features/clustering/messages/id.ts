import type { ClusteringMessages } from "./en";

export const id = {
  categories: {
    MS: { name: "Tunggal putra", term: "Men's singles", unit: "1 pemain" },
    WS: { name: "Tunggal putri", term: "Women's singles", unit: "1 pemain" },
    MD: { name: "Ganda putra", term: "Men's doubles", unit: "Pasangan 2 putra" },
    WD: { name: "Ganda putri", term: "Women's doubles", unit: "Pasangan 2 putri" },
    XD: { name: "Ganda campuran", term: "Mixed doubles", unit: "Pasangan 1 putra + 1 putri" },
  },
  entities: { singles: "pemain", doubles: "pasangan" },
  levels: {
    dominant: {
      name: "Dominan",
      tier: "Tinggi",
      description: "Performa pertandingan paling kuat di kategori ini.",
    },
    competitive: {
      name: "Kompetitif",
      tier: "Sedang",
      description: "Bersaing ketat; hasil bisa berbalik di setiap pertandingan.",
    },
    developing: {
      name: "Berkembang",
      tier: "Rendah",
      description: "Performa masih di bawah rata-rata dan masih bisa ditingkatkan.",
    },
  },
  overview: {
    metaTitle: "Kategori",
    title: "Kategori",
    description: "Clustering dijalankan terpisah untuk setiap kategori. Pilih kategori untuk melihat hasilnya.",
    columns: { code: "Kode", category: "Kategori", unit: "Unit yang bertanding", status: "Status" },
    noData: "Belum ada data",
    open: "Buka {category}",
  },
  detail: {
    back: "Semua kategori",
    unit: "Unit yang bertanding: {unit}",
    levelsTitle: "Tingkat performa",
    levelsDescription: "K-Means dengan 3 cluster, diurutkan dari centroid dengan performa tertinggi.",
    noResult: "Belum ada hasil",
    emptyTitle: "Belum ada data pertandingan",
    emptyDescription: "Import hasil pertandingan {category} untuk menjalankan clustering. Fitur import segera hadir.",
  },
} satisfies ClusteringMessages;
