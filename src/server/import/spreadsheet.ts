import readXlsxFile, { readSheet } from "read-excel-file/node";

import { parseCsv } from "@/lib/csv";
import type { MessageKey } from "@/lib/i18n/translate";
import { ApiError } from "@/utils/api-error";

// Pembacaan file import bersama: CSV atau XLSX, header di baris pertama.

export const IMPORT_MAX_ROWS = 1000;
export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;

const pad = (value: number) => String(value).padStart(2, "0");
const isoDate = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

function cellToString(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return isoDate(cell);
  return String(cell).trim();
}

/** Baris mentah (termasuk header) dari CSV atau XLSX. `invalidKey`: pesan error jika file tidak terbaca. */
export async function readRows(file: File, invalidKey: MessageKey): Promise<string[][]> {
  if (file.size > IMPORT_MAX_BYTES) throw ApiError.badRequest(invalidKey);
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith(".xlsx")) {
      // `parseNumber` mempertahankan teks asli angka — angka panjang (mis. nomor identitas) melebihi presisi Number.
      const rows = await readSheet(Buffer.from(await file.arrayBuffer()), { parseNumber: (value: string) => value });
      return rows.map((row) => row.map(cellToString)).filter((row) => row.some((cell) => cell !== ""));
    }
    if (name.endsWith(".csv") || file.type === "text/csv") return parseCsv(await file.text());
  } catch {
    throw ApiError.badRequest(invalidKey);
  }
  throw ApiError.badRequest(invalidKey);
}

/**
 * Semua sheet XLSX (nama + baris mentah termasuk header), untuk file yang memakai beberapa sheet
 * (mis. sheet 1 petunjuk, sheet berikutnya data). Hanya XLSX; `invalidKey` bila tidak terbaca.
 */
export async function readWorkbook(file: File, invalidKey: MessageKey): Promise<{ name: string; rows: string[][] }[]> {
  if (file.size > IMPORT_MAX_BYTES || !file.name.toLowerCase().endsWith(".xlsx")) {
    throw ApiError.badRequest(invalidKey);
  }
  try {
    const sheets = await readXlsxFile(Buffer.from(await file.arrayBuffer()), {
      parseNumber: (value: string) => value,
    });
    return sheets.map((sheet) => ({
      name: sheet.sheet,
      rows: sheet.data.map((row) => row.map(cellToString)).filter((row) => row.some((cell) => cell !== "")),
    }));
  } catch {
    throw ApiError.badRequest(invalidKey);
  }
}

/** `31/01/2026` atau `31-01-2026` → `2026-01-31`; format ISO dibiarkan. */
export function normalizeDate(value: string) {
  const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(value);
  return match ? `${match[3]}-${pad(Number(match[2]))}-${pad(Number(match[1]))}` : value;
}

/** Header kolom → kunci (`Service Date` → `service_date`). */
export const headerKey = (header: string) =>
  header
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

/**
 * Pisahkan header & baris data, cek batas baris, lalu petakan setiap baris ke objek per kolom yang dikenal.
 * `line` = nomor baris di file (header = baris 1). `columns` melaporkan header yang tidak dikenal (diabaikan)
 * dan kolom wajib (`required`) yang tidak ada, supaya salah ketik nama kolom terlihat sebelum error per baris.
 */
export async function readRecords(
  file: File,
  options: {
    columns: readonly string[];
    required?: readonly string[];
    invalidKey: MessageKey;
    emptyKey: MessageKey;
    tooLargeKey: MessageKey;
  },
) {
  const [header, ...body] = await readRows(file, options.invalidKey);
  if (!header || body.length === 0) throw ApiError.badRequest(options.emptyKey);
  if (body.length > IMPORT_MAX_ROWS)
    throw ApiError.badRequest(options.tooLargeKey, { params: { max: IMPORT_MAX_ROWS } });
  return mapRecords(header, body, options);
}

/** Header + baris data → objek per kolom yang dikenal (lihat `readRecords`); dipakai juga per sheet. */
export function mapRecords(
  header: string[],
  body: string[][],
  options: { columns: readonly string[]; required?: readonly string[] },
) {
  const keys = header.map(headerKey);
  const known = new Set(options.columns);
  const present = new Set(keys);
  const records = body.map((cells, index) => ({
    line: index + 2,
    raw: Object.fromEntries(keys.flatMap((key, i) => (known.has(key) ? [[key, cells[i] ?? ""]] : []))) as Record<
      string,
      string
    >,
  }));
  return {
    records,
    columns: {
      unknown: header.filter((name, i) => name.trim() && !known.has(keys[i] as string)),
      missing: (options.required ?? []).filter((column) => !present.has(column)),
    },
  };
}

/** Sumber import: file (CSV/XLSX) atau baris yang sudah diedit di layar review (JSON). */
export type ImportSource = File | { fileName: string; rows: { line: number; values: Record<string, string> }[] };

export const importSourceName = (source: ImportSource) => (source instanceof File ? source.name : source.fileName);

/** Kolom tambahan di CSV unduhan layar review (`errors`); diabaikan saat file itu diunggah ulang. */
const REPORT_ERRORS_COLUMN = "errors";

/** `readRecords` untuk file, atau baris JSON apa adanya (hanya kolom yang dikenal, dijamin schema route). */
export async function readImportSource(source: ImportSource, options: Parameters<typeof readRecords>[1]) {
  if (!(source instanceof File)) {
    const records = source.rows.map((row) => ({ line: row.line, raw: row.values }));
    return { records, columns: { unknown: [] as string[], missing: [] as string[] } };
  }
  const { records, columns } = await readRecords(source, options);
  return {
    records,
    columns: { ...columns, unknown: columns.unknown.filter((name) => headerKey(name) !== REPORT_ERRORS_COLUMN) },
  };
}

/** Template CSV: header + baris contoh. */
export const templateCsv = (columns: readonly string[], rows: string[][]) =>
  [columns.join(","), ...rows.map((row) => row.join(","))].join("\n");
