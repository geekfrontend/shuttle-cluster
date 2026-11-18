/*
 * Periode data clustering (tanggal mulai & akhir, `YYYY-MM-DD`) dan shortcut-nya: per tahun dan N bulan
 * terakhir. Shortcut relatif dihitung dari tanggal data terakhir (bukan hari ini), supaya "12 bulan terakhir"
 * tetap berisi 12 bulan data walaupun dataset berhenti sebelum hari ini. Dipakai API (periode default) dan UI.
 */

export type Period = { from: string; to: string };

/** Rentang tanggal data yang tersedia di satu kategori. */
export type DataRange = { first: string; last: string };

export const RECENT_MONTHS = [6, 12, 24] as const;
export const DEFAULT_RECENT_MONTHS = 24;

export type PeriodPreset = { kind: "months"; months: number } | { kind: "year"; year: number };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const toIso = (date: Date) => date.toISOString().slice(0, 10);

function parseIso(value: string): Date {
  if (!ISO_DATE.test(value)) throw new Error(`Invalid date ${value}`);
  return new Date(`${value}T00:00:00.000Z`);
}

/** Tanggal `months` bulan sebelum `date`, plus satu hari — awal rentang "N bulan terakhir" yang berakhir di `date`. */
function monthsBefore(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() - months;
  // Jaga tanggal tetap di dalam bulan tujuan (mis. 31 Mar − 1 bulan → 28/29 Feb, bukan 3 Mar).
  const daysInTarget = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const start = new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), daysInTarget)));
  start.setUTCDate(start.getUTCDate() + 1);
  return start;
}

function clamp(value: string, range: DataRange) {
  if (value < range.first) return range.first;
  if (value > range.last) return range.last;
  return value;
}

/** Periode sebuah shortcut, dipotong ke rentang data yang tersedia. */
export function presetPeriod(preset: PeriodPreset, range: DataRange): Period {
  if (preset.kind === "year") {
    return { from: clamp(`${preset.year}-01-01`, range), to: clamp(`${preset.year}-12-31`, range) };
  }
  return { from: clamp(toIso(monthsBefore(parseIso(range.last), preset.months)), range), to: range.last };
}

/** Shortcut yang relevan untuk rentang data: N bulan terakhir, lalu tiap tahun dari yang terbaru. */
export function periodPresets(range: DataRange): PeriodPreset[] {
  const firstYear = Number(range.first.slice(0, 4));
  const lastYear = Number(range.last.slice(0, 4));
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => lastYear - index);
  return [
    ...RECENT_MONTHS.map((months): PeriodPreset => ({ kind: "months", months })),
    ...years.map((year): PeriodPreset => ({ kind: "year", year })),
  ];
}

/** Periode default bila pengguna belum memilih: 24 bulan terakhir data. */
export function defaultPeriod(range: DataRange): Period {
  return presetPeriod({ kind: "months", months: DEFAULT_RECENT_MONTHS }, range);
}

/** Shortcut yang persis sama dengan `period` (untuk menandai pilihan aktif di UI), atau `null`. */
export function matchingPreset(period: Period, range: DataRange): PeriodPreset | null {
  return (
    periodPresets(range).find((preset) => {
      const candidate = presetPeriod(preset, range);
      return candidate.from === period.from && candidate.to === period.to;
    }) ?? null
  );
}
