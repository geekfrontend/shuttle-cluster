/**
 * Semua aksi yang ditulis ke audit log. `writeAudit` hanya menerima nilai dari daftar ini —
 * tambahkan di sini saat membuat aksi baru.
 */
export const AUDIT_ACTIONS = [
  "auth.login",
  "auth.login_failed",
  "auth.locked",
  "auth.logout",
  "auth.password_changed",
  "me.updated",
  "users.create",
  "users.update",
  "users.password_reset",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
