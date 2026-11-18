"use client";

import { useMemo } from "react";

import { createFormatters } from "@/lib/formatters";
import { useLocale } from "@/lib/i18n/locale-provider";

/** Formatter tanggal/angka sesuai locale UI aktif. */
export function useFormatters() {
  const locale = useLocale();
  return useMemo(() => createFormatters(locale), [locale]);
}
