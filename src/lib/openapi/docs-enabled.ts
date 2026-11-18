/** Dokumentasi API aktif di development; di production hanya jika `API_DOCS_ENABLED=true`. */
export function isApiDocsEnabled(): boolean {
  if (process.env.API_DOCS_ENABLED) return process.env.API_DOCS_ENABLED === "true";
  return process.env.NODE_ENV !== "production";
}
