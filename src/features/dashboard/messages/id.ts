import type { DashboardMessages } from "./en";

export const id = {
  metaTitle: "Dasbor",
  greeting: "Selamat datang kembali, {name}",
  description: "Kelompokkan pemain bulu tangkis berdasarkan performa pertandingan.",
  quickLinks: "Tautan cepat",
  links: {
    users: { title: "Pengguna", description: "Tambah akun, ubah role, atau reset kata sandi." },
    account: { title: "Akun", description: "Profil, bahasa, dan keamanan." },
  },
} satisfies DashboardMessages;
