import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

import { Marquee } from "./marquee";

/**
 * Media untuk empty state yang sebenarnya ajakan: putaran baris placeholder yang mewakili data
 * yang akan ada setelah record pertama dibuat. Ia menunjukkan bentuk yang belum ada, bukan sekadar
 * mengumumkan kekosongan — karena itu memakai ikon layar itu sendiri.
 *
 * `size="sm"` untuk ruang sempit seperti body tabel: marquee lebih pendek, baris dan ikon lebih kecil.
 *
 * Murni dekoratif — `Marquee` sudah `aria-hidden`, jadi judul & deskripsi yang membawa makna.
 * Pakai di dalam `EmptyMedia` / `EmptyHeader` dari `@/components/ui/empty`.
 */
export function EmptyStateMarquee({
  icon: Icon,
  size = "default",
}: {
  readonly icon: LucideIcon;
  readonly size?: "default" | "sm";
}) {
  const sm = size === "sm";
  return (
    <div className={cn("mask-y-from-60% mask-x-from-95% w-full space-y-2", sm ? "mb-1 max-w-60" : "mb-3 max-w-xs")}>
      <Marquee className={cn("[--duration:12s]", sm ? "h-28 [--gap:0.5rem]" : "h-40")} repeat={5} vertical>
        <div className={cn("flex w-full items-center border bg-card", sm ? "gap-2 px-3 py-2" : "gap-3 px-4 py-3")}>
          <Icon className={cn("shrink-0 text-muted-foreground/70", sm ? "size-3.5" : "size-5")} />
          <div className={cn("w-full bg-muted", sm ? "h-2.5" : "h-4")} />
          <div className={cn("ms-auto shrink-0 bg-muted", sm ? "size-3.5" : "size-5")} />
        </div>
      </Marquee>
    </div>
  );
}
