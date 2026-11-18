import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { WebSocket as UndiciWebSocket } from "undici";

import { type Prisma, PrismaClient } from "@/generated/prisma/client";
import { logger } from "@/utils/logger";

/*
 * Driver Neon berbicara lewat WebSocket. `WebSocket` global baru tersedia sejak Node 22, dan runtime yang
 * lebih lama (mis. project Vercel yang masih Node 20) gagal membuka koneksi dengan `ErrorEvent` tanpa pesan
 * yang berguna. Implementasi dari `undici` dipakai sebagai cadangan; pada Node 22+ blok ini dilewati.
 */
if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = UndiciWebSocket as unknown as typeof neonConfig.webSocketConstructor;
}

// Koneksi pooled Neon untuk runtime. Adapter baru membuka koneksi saat query pertama,
// jadi import modul ini tidak gagal saat build meski DATABASE_URL belum ada.
function createClient() {
  const connectionString = process.env.DATABASE_URL;
  // Tanpa env ini, kegagalannya baru muncul jauh di dalam driver sebagai error koneksi yang membingungkan.
  if (!connectionString) logger.error("DATABASE_URL is not set; every database query will fail");
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type Tx = Prisma.TransactionClient;
