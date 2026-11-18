import type { CSSProperties } from "react";

import { cn } from "cn";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  /** Detik untuk satu kali lintasan kilau. */
  speed?: number;
  className?: string;
  /** Warna dasar teks (default token `--primary`). */
  color?: string;
  /** Warna kilau (default token `--primary-foreground`). */
  shineColor?: string;
  /** Sudut gradien kilau, derajat. */
  spread?: number;
  /** Bolak-balik, bukan selalu dari satu sisi. */
  yoyo?: boolean;
  pauseOnHover?: boolean;
  direction?: "left" | "right";
  /** Jeda (detik) sebelum lintasan pertama. */
  delay?: number;
}

function animationDirection(direction: "left" | "right", yoyo: boolean) {
  if (yoyo) return direction === "right" ? "alternate-reverse" : "alternate";
  return direction === "right" ? "reverse" : "normal";
}

/**
 * Teks dengan kilau yang melintas. Murni CSS (tanpa library animasi): gradien di `background-clip: text`
 * digeser lewat keyframes `shiny-text` di `globals.css`. Warna default memakai token tema, jadi ikut
 * preset dan mode gelap. Diam di bawah `prefers-reduced-motion`.
 */
export function ShinyText({
  text,
  disabled = false,
  speed = 2,
  className,
  color = "var(--primary)",
  shineColor = "var(--primary-foreground)",
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = "left",
  delay = 0,
}: ShinyTextProps) {
  const style = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    backgroundSize: "200% auto",
    backgroundPosition: "150% center",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    // Longhand di elemen ini (bukan var() di tema) agar setiap ShinyText punya kecepatan & arah sendiri.
    animationDuration: `${speed}s`,
    animationDelay: `${delay}s`,
    animationDirection: animationDirection(direction, yoyo),
  } as CSSProperties;

  return (
    <span
      className={cn(
        "inline-block",
        !disabled && "animate-shiny-text motion-reduce:animate-none",
        pauseOnHover && "hover:[animation-play-state:paused]",
        className,
      )}
      style={style}
    >
      {text}
    </span>
  );
}
