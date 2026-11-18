import type { AuthMessages } from "./en";

export const id = {
  login: {
    metaTitle: "Masuk",
    metaDescription: "Masuk ke akun ShuttleCluster Anda.",
    title: "Masuk",
    subtitle: "Masukkan email dan kata sandi yang diberikan oleh administrator Anda.",
    emailLabel: "Email",
    emailPlaceholder: "anda@contoh.com",
    emailInvalid: "Masukkan alamat email yang valid.",
    passwordLabel: "Kata sandi",
    passwordRequired: "Masukkan kata sandi Anda.",
    submit: "Masuk",
  },
  feedback: {
    invalidTitle: "Gagal masuk",
    lockedTitle: "Akun dikunci sementara",
    rateLimitedTitle: "Terlalu banyak percobaan",
    networkTitle: "Tidak ada koneksi",
    networkDescription: "Server tidak dapat dihubungi. Periksa koneksi Anda lalu coba lagi.",
    genericTitle: "Terjadi kesalahan",
    genericDescription: "Silakan coba lagi sebentar lagi.",
    successTitle: "Berhasil masuk",
    successDescription: "Mengarahkan ke ruang kerja Anda…",
  },
  visual: {
    headlineTop: "Data pertandingan,",
    headlineBottom: "tingkat pemain jelas",
    subtitle: "Kelompokkan pemain bulu tangkis berdasarkan performa pertandingan dengan K-Means clustering.",
    matchesAnalysed: "Pertandingan dianalisis",
    topCluster: "Klaster performa tinggi",
    topClusterPlayers: "{count} pemain",
    winRate: "Rata-rata win rate",
    winRateValue: "Tunggal putra · {value}",
  },
  unauthorized: {
    metaTitle: "Tidak berwenang",
    title: "Akses tidak berwenang",
    description:
      "Anda tidak punya izin untuk melihat konten yang diminta. Hubungi administrator situs bila menurut Anda ini keliru.",
    action: "Ke halaman utama",
  },
} satisfies AuthMessages;
