import { type NextRequest, NextResponse } from "next/server";

import { DEFAULT_LOCALE, LOCALE_HEADER, matchAcceptLanguage, toLocale } from "@/lib/i18n/config";
import { type MessageKey, translate } from "@/lib/i18n/translate";

// Nama cookie diduplikasi dari server/auth/session.ts agar proxy tidak mengimpor Prisma.
const SESSION_COOKIE = "shuttle_session";
const PUBLIC_API_PATHS = new Set([
  "/api/health",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/docs",
  "/api/openapi.json",
]);
const PUBLIC_PAGES = new Set(["/login", "/unauthorized"]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function reject(req: NextRequest, statusCode: number, code: MessageKey) {
  const locale =
    toLocale(req.headers.get(LOCALE_HEADER)) ??
    matchAcceptLanguage(req.headers.get("accept-language")) ??
    DEFAULT_LOCALE;
  return NextResponse.json(
    { success: false, code, message: translate(locale, code), statusCode },
    { status: statusCode, headers: { "content-language": locale, "cache-control": "no-store" } },
  );
}

/**
 * Lapisan pertama (murah, tanpa DB):
 * - tolak mutasi lintas origin (pelengkap cookie SameSite=Lax),
 * - `/api/*` tanpa cookie session ke endpoint non-publik → 401 JSON,
 * - halaman tanpa cookie session → redirect ke `/login?next=...`.
 * Validasi session sesungguhnya tetap di handler (`requireSession`) dan layout `(protected)` (`getSession`).
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (!SAFE_METHODS.has(req.method)) {
    const origin = req.headers.get("origin");
    if (origin && origin !== req.nextUrl.origin) return reject(req, 403, "error.origin_mismatch");
  }

  const hasSession = req.cookies.has(SESSION_COOKIE);

  if (pathname.startsWith("/api/")) {
    if (!PUBLIC_API_PATHS.has(pathname) && !hasSession) return reject(req, 401, "auth.authentication_required");
    return NextResponse.next();
  }

  if (!hasSession && !PUBLIC_PAGES.has(pathname)) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    // Semua halaman, kecuali aset statis & file metadata.
    "/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)",
  ],
};
