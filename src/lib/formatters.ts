/**
 * Formatter tanggal/angka/rupiah untuk satu locale. Murni (tanpa React), jadi dipakai hook `useFormatters` di
 * klien dan pembuat laporan di server — `timeZone` diisi di server supaya jam mengikuti zona waktu pengguna.
 */
export function createFormatters(locale: string, timeZone?: string) {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone });
  const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone });
  const number = new Intl.NumberFormat(locale);
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
  const quantity = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return {
    date: (value: string | Date) => date.format(new Date(value)),
    dateTime: (value: string | Date) => dateTime.format(new Date(value)),
    number: (value: number) => number.format(value),
    /** Rupiah; menerima nominal string dari API (BigInt). */
    money: (value: number | string) => money.format(Number(value)),
    /** Jumlah item tanpa desimal berlebih (`1`, `1,5`). */
    quantity: (value: number) => quantity.format(value),
  };
}

export type Formatters = ReturnType<typeof createFormatters>;

/** Zona waktu IANA yang valid, atau `undefined` (dipakai untuk parameter dari klien). */
export function validTimeZone(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return value;
  } catch {
    return undefined;
  }
}
