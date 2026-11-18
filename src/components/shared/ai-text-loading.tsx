"use client";

import { useEffect, useState } from "react";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface AITextLoadingProps {
  /** Pesan status yang bergantian (sudah dilokalkan pemanggil). */
  readonly texts: readonly string[];
  /** Milidetik per pesan. */
  readonly interval?: number;
  readonly className?: string;
}

/**
 * Indikator "AI sedang bekerja": pesan status bergantian dengan kilau gradien yang melintas. Diadaptasi dari
 * AI Text Loading kokonutui (MIT) — warna memakai token tema supaya ikut preset & mode gelap. Pesan yang berganti
 * tidak diumumkan satu per satu ke pembaca layar; status sebenarnya disampaikan pemanggil. Di bawah
 * `prefers-reduced-motion` hanya pesan pertama yang tampil, diam.
 */
export function AITextLoading({ texts, interval = 1500, className }: AITextLoadingProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || texts.length < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % texts.length), interval);
    return () => clearInterval(timer);
  }, [interval, reduceMotion, texts.length]);

  const text = texts[index % texts.length] ?? "";
  const textClass = cn(
    "block truncate bg-[length:200%_100%] bg-linear-to-r from-foreground via-muted-foreground to-foreground bg-clip-text text-transparent",
    className,
  );

  if (reduceMotion) {
    return (
      <span aria-hidden="true" className={textClass}>
        {texts[0]}
      </span>
    );
  }

  return (
    <span aria-hidden="true" className="relative block overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={index}
          className={textClass}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, backgroundPosition: ["200% center", "-200% center"] }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            opacity: { duration: 0.3 },
            y: { duration: 0.3 },
            backgroundPosition: { duration: 2.5, ease: "linear", repeat: Number.POSITIVE_INFINITY },
          }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
