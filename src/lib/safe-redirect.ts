/**
 * Terima hanya path internal ("/users", "/kanban?x=1"). Menolak URL absolut,
 * protocol-relative ("//evil.com"), dan backslash — mencegah open redirect lewat `?next=`.
 */
export function safeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("\\")) return fallback;
  // Halaman auth (termasuk path lama `/auth/*`) dan API bukan tujuan setelah login.
  if (value.startsWith("/login") || value.startsWith("/auth") || value.startsWith("/api/")) return fallback;
  return value;
}
