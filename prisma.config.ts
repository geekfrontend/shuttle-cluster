import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Sama seperti Next.js: `.env.local` (hasil `vercel env pull`) diprioritaskan di atas `.env`.
config({ path: [".env.local", ".env"], quiet: true });

// `prisma generate` tidak butuh koneksi DB, jadi URL boleh kosong saat build tanpa env.
// Migrasi & Studio memakai koneksi langsung (non-pooled) Neon.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
