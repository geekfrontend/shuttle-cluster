/** Komponen dari registry shadcn mengimpor `cn` dari alias `utils` (`@/lib/utils`); proyek ini memakai paket `cn`. */
export { cn } from "cn";

/**
 * Maksimal dua huruf untuk avatar: huruf pertama kata pertama dan kata terakhir (`Viktor AXELSEN` → `VA`).
 * Nama panjang tidak meluber keluar dari avatar kecil, dan tanda baca dilewati (`(CJ) YULIANTI` → `CY`).
 */
export const getInitials = (str: string): string => {
  if (typeof str !== "string") return "?";

  const letters = str
    .split(/\s+/)
    .map((word) => word.match(/\p{L}/u)?.[0])
    .filter((letter): letter is string => letter !== undefined);
  const first = letters[0] ?? "";
  const last = letters.length > 1 ? (letters[letters.length - 1] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
};

export function formatCurrency(
  amount: number,
  opts?: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    noDecimals?: boolean;
  },
) {
  const { currency = "USD", locale = "en-US", minimumFractionDigits, maximumFractionDigits, noDecimals } = opts ?? {};

  const formatOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: noDecimals ? 0 : minimumFractionDigits,
    maximumFractionDigits: noDecimals ? 0 : maximumFractionDigits,
  };

  return new Intl.NumberFormat(locale, formatOptions).format(amount);
}
