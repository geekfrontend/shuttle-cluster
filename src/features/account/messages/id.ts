import type { AccountMessages } from "./en";

export const id = {
  page: {
    metaTitle: "Akun",
    title: "Akun",
    description: "Pengaturan pribadi Anda.",
  },
  tabs: { profile: "Profil", preferences: "Preferensi", security: "Keamanan" },
  profile: {
    title: "Profil",
    description: "Cara pengguna lain melihat Anda.",
    name: "Nama lengkap",
    email: "Email",
    emailHint: "Dipakai untuk masuk. Hubungi admin untuk mengubahnya.",
    save: "Simpan profil",
  },
  preferences: {
    title: "Preferensi",
    description: "Hanya memengaruhi tampilan Anda.",
    language: "Bahasa",
    auto: "Ikuti browser",
    saved: "Bahasa diperbarui.",
  },
  security: {
    title: "Keamanan",
    description: "Detail masuk akun Anda.",
    password: "Kata sandi",
    passwordDisabled: "Penggantian kata sandi dinonaktifkan sementara. Minta admin untuk me-reset-nya.",
    created: "Akun dibuat",
    lastActive: "Terakhir aktif",
  },
} satisfies AccountMessages;
