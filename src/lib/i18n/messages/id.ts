import type { MessageKey } from "./en";

export const id: Record<MessageKey, string> = {
  "common.ok": "Berhasil",

  "error.bad_request": "Permintaan tidak valid",
  "error.invalid_json": "Body permintaan harus berupa JSON yang valid",
  "error.validation_failed": "Data tidak valid",
  "error.unauthorized": "Tidak terautentikasi",
  "error.forbidden": "Akses ditolak",
  "error.not_found": "Data tidak ditemukan",
  "error.conflict": "Terjadi konflik data",
  "error.already_exists": "Data sudah ada",
  "error.locked": "Terkunci",
  "error.too_many_requests": "Terlalu banyak permintaan, coba lagi dalam {retryAfterSeconds} detik",
  "error.internal": "Terjadi kesalahan pada server",
  "error.unavailable": "Layanan sedang tidak tersedia",
  "error.origin_mismatch": "Permintaan lintas origin ditolak",

  "validation.date": "Gunakan format tanggal YYYY-MM-DD",

  "health.ok": "Layanan berjalan normal",
  "health.db_unavailable": "Database tidak tersedia",

  "auth.authentication_required": "Silakan login terlebih dahulu",
  "auth.invalid_credentials": "Email atau kata sandi salah",
  "auth.account_locked": "Akun dikunci sementara. Coba lagi dalam {minutes} menit",
  "auth.password_change_required": "Anda wajib mengganti kata sandi sebelum melanjutkan",
  "auth.login_success": "Berhasil login",
  "auth.logout_success": "Berhasil logout",
  "auth.session_active": "Session aktif",
  "auth.session_refreshed": "Session diperpanjang",
  "auth.password_changed": "Kata sandi berhasil diganti",
  "auth.current_password_incorrect": "Kata sandi saat ini salah",
  "auth.password_reused": "Kata sandi baru harus berbeda dari kata sandi saat ini",
  "auth.admin_required": "Hanya admin yang dapat melakukan ini",

  "me.profile": "Profil",
  "me.updated": "Profil berhasil diperbarui",

  "users.list": "Pengguna",
  "users.created": "Akun pengguna berhasil dibuat",
  "users.updated": "Pengguna berhasil diperbarui",
  "users.password_reset": "Kata sandi di-reset; semua session pengguna ini telah dikeluarkan",
  "users.not_found": "Pengguna tidak ditemukan",
  "users.email_taken": "Email ini sudah terdaftar",
  "users.cannot_modify_self": "Anda tidak dapat mengubah role, status, atau kata sandi Anda sendiri di sini",
  "users.last_admin": "Harus tersisa minimal satu admin aktif",
};
