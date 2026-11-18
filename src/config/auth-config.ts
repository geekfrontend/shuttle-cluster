export const AUTH_CONFIG = {
  /**
   * Fitur ganti password di API: wajib ganti saat login pertama (`mustChangePassword`) dan
   * `PATCH /api/me/password`. Dinonaktifkan sementara; halaman UI-nya sudah dihapus.
   */
  passwordChangeEnabled: false,
} as const;
