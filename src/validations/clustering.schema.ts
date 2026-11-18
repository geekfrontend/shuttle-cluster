import { z } from "zod";

import { localized } from "@/lib/i18n/validation-message";

import { dateSchema } from "./common.schema";
import { categorySchema } from "./match.schema";

const booleanQuery = z.enum(["true", "false"]).transform((value) => value === "true");

export const clusteringQuerySchema = z
  .object({
    category: categorySchema,
    /** Tanggal mulai & akhir (inklusif). Kosong = 24 bulan terakhir data kategori ini. */
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    /** Lewati babak kualifikasi (round berawalan `Q`). Default `true`. */
    mainDraw: booleanQuery.default(true),
    /** Hanya turnamen dengan level ≥ ini (1 = Super 100 / Grand Prix … 5 = Super 1000, Finals, Kejuaraan Dunia & Olimpiade). */
    minTier: z.coerce.number().int().min(1).max(5).default(1),
    /** Minimal jumlah pertandingan per unit supaya ikut di-cluster. */
    minMatches: z.coerce.number().int().min(1).max(200).default(10),
    normalization: z.enum(["zscore", "minmax"]).default("zscore"),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    path: ["to"],
    ...localized("validation.period"),
  });
