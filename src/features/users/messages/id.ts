import type { UsersMessages } from "./en";

export const id = {
  list: {
    metaTitle: "Pengguna",
    title: "Pengguna",
    description: "Akun yang dapat masuk, beserta role-nya.",
    searchPlaceholder: "Cari nama atau email…",
    role: "Role",
    status: "Status",
    add: "Tambah pengguna",
    empty: "Belum ada pengguna",
    emptyDescription: "Tambahkan akun agar orang lain dapat masuk.",
    columns: {
      user: "Pengguna",
      role: "Role",
      status: "Status",
      lastActive: "Terakhir aktif",
      created: "Dibuat",
    },
  },
  rowActions: {
    makeAdmin: "Jadikan admin",
    makeUser: "Ubah ke pengguna",
    deactivate: "Nonaktifkan",
    activate: "Aktifkan",
    resetPassword: "Reset kata sandi",
  },
  deactivate: {
    title: "Nonaktifkan {name}?",
    description: "{name} tidak dapat masuk lagi dan dikeluarkan dari semua perangkat. Akun dapat diaktifkan kembali.",
    confirm: "Nonaktifkan",
  },
  create: {
    title: "Tambah pengguna",
    description: "Buat akun dengan kata sandi awal. Sampaikan kata sandi tersebut ke pengguna secara langsung.",
    email: "Email",
    emailInvalid: "Masukkan alamat email yang valid.",
    name: "Nama",
    nameRequired: "Isi nama.",
    password: "Kata sandi awal",
    role: "Role",
    roleHint: "Admin dapat mengelola pengguna. Pengguna memiliki akses biasa.",
    submit: "Tambah pengguna",
  },
  reset: {
    title: "Reset kata sandi {name}",
    description: "Atur kata sandi sementara. Kunci akun dibuka dan semua perangkat dikeluarkan.",
    password: "Kata sandi baru",
    submit: "Reset kata sandi",
  },
} satisfies UsersMessages;
