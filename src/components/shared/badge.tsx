import type { ComponentProps } from "react";

import { cn } from "cn";

import { Badge as BadgePrimitive } from "@/components/ui/badge";

/**
 * Satu-satunya badge berwarna yang dipakai tiap layar untuk menunjukkan status.
 *
 * `tone` membawa makna, bukan warna — dipilih dari peran badge itu di alur kerja (selesai baik,
 * selesai buruk, menunggu tindakan, masih berjalan, dst.), bukan dari kecocokan warna di mata.
 * Sumber tunggal ini menggantikan peta warna ad-hoc yang sebelumnya diulang di tiap komponen status
 * (badge status per fitur),
 * supaya "aktif" atau "berisiko tinggi" selalu tampil dengan warna yang sama di seluruh aplikasi.
 */
export type BadgeTone =
  /** Fakta atau kategori, bukan status — tanpa titik warna. */
  | "neutral"
  /** Dimatikan dengan sengaja: nonaktif, diarsipkan, ditutup. Bukan kegagalan, jadi netral, bukan merah. */
  | "inactive"
  /** Selesai dengan baik: aktif, disetujui, lulus verifikasi. */
  | "success"
  /** Selesai buruk atau terhambat: ditolak, terkunci, dijadwalkan hapus, risiko/tingkat keparahan tinggi. */
  | "danger"
  /** Butuh perhatian, belum tentu bermasalah: ditangguhkan, draf, sedang dinilai, risiko sedang. */
  | "warning"
  /** Menunggu seseorang bertindak: baru diajukan, kasus baru dibuka. */
  | "pending"
  /** Sedang berjalan sekarang: sedang diselidiki, risiko rendah yang masih perlu dipantau. */
  | "progress"
  /** Menandai tonggak akhir alur tanpa menyatakan baik/buruk (mis. proses selesai). */
  | "accent";

/** Warna titik per tone. Diekspor untuk penanda status ringkas (titik/garis) di luar badge, mis. linimasa. */
export const BADGE_DOT_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-muted-foreground",
  inactive: "bg-muted-foreground",
  success: "bg-emerald-500",
  danger: "bg-destructive",
  warning: "bg-amber-500",
  pending: "bg-orange-500",
  progress: "bg-sky-500",
  accent: "bg-primary",
};

/** Isian penuh untuk badge yang menonjolkan nilai (mis. skor risiko), bukan status sebaris. */
const TINT_TONE: Record<BadgeTone, string> = {
  neutral: "text-muted-foreground",
  inactive: "border-transparent bg-muted text-muted-foreground",
  success: "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  danger: "border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/20",
  warning: "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  pending: "border-orange-500/40 bg-orange-50 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
  progress: "border-sky-500/40 bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  accent: "border-primary/40 bg-primary/10 text-primary",
};

export interface BadgeProps extends Omit<ComponentProps<typeof BadgePrimitive>, "variant"> {
  /** @default "neutral" */
  readonly tone?: BadgeTone;
  /** Tampilkan titik warna di depan label. Default menyala untuk semua tone kecuali `neutral`. */
  readonly dot?: boolean;
  /** `outline` (default): garis tipis + titik warna, untuk badge status sebaris di tabel/daftar.
   *  `tint`: isian warna penuh tanpa titik, untuk badge yang menonjolkan sebuah nilai. */
  readonly emphasis?: "outline" | "tint";
}

export function Badge({ tone = "neutral", dot, emphasis = "outline", className, children, ...props }: BadgeProps) {
  const showDot = (dot ?? tone !== "neutral") && emphasis === "outline";

  return (
    <BadgePrimitive
      variant="outline"
      className={cn("gap-1.5 font-normal", emphasis === "tint" && TINT_TONE[tone], className)}
      {...props}
    >
      {showDot && <span className={cn("size-1.5", BADGE_DOT_CLASS[tone])} aria-hidden="true" />}
      {children}
    </BadgePrimitive>
  );
}
