import type { MetadataRoute } from "next";

// Set NEXT_PUBLIC_SITE_URL ke domain deploy (mis. di Vercel).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const PUBLIC_ROUTES = ["/", "/users", "/login"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
  }));
}
