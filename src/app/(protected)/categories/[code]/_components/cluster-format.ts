"use client";

import type { ClusterMember } from "@/features/clustering/types";
import { useLocale } from "@/lib/i18n/locale-provider";

/** Nama unit: pemain tunggal, atau dua pemain dipisah ` / `. */
export const memberName = (member: ClusterMember) => member.players.map((player) => player.name).join(" / ");

/** Formatter angka hasil clustering sesuai locale UI. */
export function useClusterFormat() {
  const locale = useLocale();
  const percent = new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const signed = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  });
  const integer = new Intl.NumberFormat(locale);
  const decimals = (digits: number) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });

  return {
    percent: (value: number) => percent.format(value),
    signed: (value: number) => signed.format(value),
    integer: (value: number) => integer.format(value),
    /** Angka desimal tetap, default 3 digit (nilai ternormalisasi, jarak, silhouette). */
    decimal: (value: number, digits = 3) => decimals(digits).format(value),
    /** `YYYY-MM-DD` → tanggal pendek sesuai locale (tanpa geser zona waktu). */
    date: (value: string) => date.format(new Date(`${value}T00:00:00.000Z`)),
  };
}

export type ClusterFormat = ReturnType<typeof useClusterFormat>;
