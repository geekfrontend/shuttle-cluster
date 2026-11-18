import type { ComponentPropsWithoutRef } from "react";

import { cn } from "cn";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  /** Jalankan track ke arah sebaliknya. */
  reverse?: boolean;
  pauseOnHover?: boolean;
  /** Bergulir atas-ke-bawah, bukan kiri-ke-kanan. */
  vertical?: boolean;
  /**
   * Berapa kali `children` diulang. Track harus melebihi containernya agar putaran terlihat mulus,
   * jadi angka ini naik ketika item makin kecil.
   */
  repeat?: number;
}

/**
 * Track berulang tanpa sambungan. `--duration` dan `--gap` dibaca dari CSS custom property, jadi
 * kecepatan bisa diatur dengan utility class (`[--duration:12s]`), bukan prop.
 *
 * Animasi bersifat dekoratif, jadi berhenti total di bawah `prefers-reduced-motion`: anak yang
 * diulang cukup tersusun sebagai daftar statis yang tetap terbaca.
 */
export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      aria-hidden
      className={cn(
        "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
    >
      {Array.from({ length: repeat }, (_, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: salinan statis dari children yang sama
          key={index}
          className={cn(
            "flex shrink-0 justify-around [animation-duration:var(--duration)] [gap:var(--gap)] motion-reduce:animate-none",
            vertical ? "animate-marquee-vertical flex-col" : "animate-marquee flex-row",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
