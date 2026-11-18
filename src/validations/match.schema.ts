import { z } from "zod";

import { CATEGORY_CODES } from "@/lib/badminton/categories";
import { MAX_GAMES, MAX_POINTS } from "@/lib/badminton/match-rules";
import { paginationSchema } from "@/lib/pagination";

import { csvListSchema, dateSchema, uuidSchema } from "./common.schema";

export const categorySchema = z.enum(CATEGORY_CODES);

export const listMatchesQuerySchema = paginationSchema.extend({
  /** Cari nama turnamen atau nama pemain. */
  q: z.string().trim().max(120).optional(),
  category: csvListSchema(categorySchema),
});

const pointsSchema = z.number().int().min(0).max(MAX_POINTS);

/** Satu sisi: 1 pemain (tunggal) atau 2 pemain (ganda); jumlah & gender dicek terhadap kategori di service. */
const sideSchema = z.array(uuidSchema).min(1).max(2);

export const createMatchSchema = z
  .object({
    category: categorySchema,
    tournament: z.string().trim().min(1).max(160),
    round: z.string().trim().max(60).nullable().optional(),
    playedOn: dateSchema,
    sideA: sideSchema,
    sideB: sideSchema,
    games: z.array(z.object({ scoreA: pointsSchema, scoreB: pointsSchema }).strict()).max(MAX_GAMES),
    /** Retired/walkover: game terakhir boleh belum selesai dan `winner` wajib diisi. */
    retired: z.boolean().default(false),
    winner: z.enum(["a", "b"]).optional(),
  })
  .strict();
