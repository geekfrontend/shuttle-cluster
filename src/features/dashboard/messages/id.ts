import type { DashboardMessages } from "./en";

export const id = {
  metaTitle: "Dasbor",
  greeting: "Selamat datang kembali, {name}",
  description: "Kelompokkan pemain bulu tangkis berdasarkan performa pertandingan.",
  quickLinks: "Tautan cepat",
  charts: {
    distributionTitle: "Cluster per kategori",
    distributionDescription:
      "Jumlah pemain atau pasangan di tiap tingkat, 24 bulan terakhir data, main draw, minimal 10 pertandingan.",
    matchesTitle: "Pertandingan per tahun",
    matchesDescription: "Semua kategori di database.",
    matches: "Pertandingan",
    noMatches: "Belum ada data pertandingan.",
    failed: "Ringkasan clustering gagal dimuat.",
  },
  links: {
    players: { title: "Pemain", description: "Pemain beserta gender, negara, dan jumlah pertandingan." },
    matches: { title: "Pertandingan", description: "Hasil pertandingan per kategori dengan skor per game." },
    categories: { title: "Kategori", description: "Cluster performa per kategori: MS, WS, MD, WD, XD." },
    users: { title: "Pengguna", description: "Tambah akun, ubah role, atau reset kata sandi." },
    account: { title: "Akun", description: "Profil, bahasa, dan keamanan." },
  },
} satisfies DashboardMessages;
