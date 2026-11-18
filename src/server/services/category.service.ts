import { prisma } from "@/db/client";
import type { CategoryCode } from "@/lib/badminton/categories";

export type CategoryStats = {
  matches: number;
  /** Unit yang pernah bertanding: pemain (tunggal) atau pasangan (ganda). */
  units: number;
  /** Tanggal pertandingan pertama & terakhir (`YYYY-MM-DD`), atau `null` bila belum ada data. */
  first: string | null;
  last: string | null;
};

const iso = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : null);

/** Ringkasan data per kategori untuk daftar kategori (dua query agregat, tanpa memuat pertandingan). */
export async function getCategoryStats(): Promise<Partial<Record<CategoryCode, CategoryStats>>> {
  const [matches, entries] = await Promise.all([
    prisma.match.groupBy({
      by: ["category"],
      _count: { _all: true },
      _min: { playedOn: true },
      _max: { playedOn: true },
    }),
    prisma.entry.groupBy({ by: ["category"], _count: { _all: true } }),
  ]);
  const units = new Map(entries.map((row) => [row.category, row._count._all]));
  return Object.fromEntries(
    matches.map((row) => [
      row.category,
      {
        matches: row._count._all,
        units: units.get(row.category) ?? 0,
        first: iso(row._min.playedOn),
        last: iso(row._max.playedOn),
      } satisfies CategoryStats,
    ]),
  );
}
