"use client";

import { useEffect, useState } from "react";

import { GrainGradient } from "@paper-design/shaders-react";
import { Target, TrendingUp, Trophy } from "lucide-react";

import { type AuthMessages, authMessages } from "@/features/auth/messages";
import { useLocale, useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

const HIGHLIGHT = "rgb(255, 255, 255)";

// Cuplikan dekoratif (data fiktif) supaya panel tidak kosong.
const MATCH_VOLUME = [38, 52, 44, 61, 57, 72, 66, 84, 78, 92];

const glass = "rounded-none border border-white/20 bg-black/35 text-white shadow-lg shadow-black/20 backdrop-blur-md";

/** Shader hanya menerima hex/rgb/hsl, sedangkan token tema berformat oklch → konversi lewat canvas 1×1. */
function readPrimaryColor(): string | null {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!value || !context) return null;
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

/** Warna primary tema aktif; ikut berubah saat preset atau mode terang/gelap diganti. */
function usePrimaryColor() {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setColor(readPrimaryColor());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return color;
}

export function LoginVisual() {
  const primary = usePrimaryColor();
  const m = useMessages(authMessages).visual;

  return (
    <div className="relative hidden min-h-0 overflow-hidden rounded-none bg-black p-8 text-white lg:flex xl:p-12">
      {primary && (
        <GrainGradient
          speed={1}
          scale={1}
          rotation={0}
          offsetX={0}
          offsetY={0}
          softness={0.5}
          intensity={0.5}
          noise={0.25}
          shape="corners"
          frame={2854.5}
          colors={[HIGHLIGHT, primary, primary, HIGHLIGHT]}
          colorBack="rgba(0, 0, 0, 0)"
          className="absolute inset-0 bg-black"
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col justify-between gap-8">
        <div className="pt-[6dvh]">
          <h2 className="max-w-xl font-medium text-5xl leading-[0.98] tracking-tighter xl:text-6xl 2xl:text-7xl">
            {m.headlineTop}
            <br />
            {m.headlineBottom}
          </h2>
          <p className="mt-5 max-w-md text-lg text-white/75 leading-snug">{m.subtitle}</p>
        </div>

        <PreviewCards m={m} />
      </div>
    </div>
  );
}

function PreviewCards({ m }: { readonly m: AuthMessages["visual"] }) {
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  return (
    <div aria-hidden="true" className="grid max-w-lg gap-3 [@media(max-height:46rem)]:hidden">
      <div className={`${glass} p-5`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/70">{m.matchesAnalysed}</p>
            <p className="mt-1 font-medium text-3xl tabular-nums tracking-tight">{number.format(1284)}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-none bg-white/15 px-2 py-0.5 text-xs">
            <TrendingUp className="size-3.5" />
            {percent.format(0.124)}
          </span>
        </div>
        <div className="mt-5 flex h-14 items-end gap-1.5">
          {MATCH_VOLUME.map((value, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: data statis dekoratif
              key={index}
              className="flex-1 rounded-none bg-white/70 last:bg-white"
              style={{ height: `${value}%` }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`${glass} p-4`}>
          <Trophy className="size-5 text-white" />
          <p className="mt-3 font-medium text-sm">{m.topCluster}</p>
          <p className="mt-0.5 text-white/70 text-xs">
            {interpolate(m.topClusterPlayers, { count: number.format(12) })}
          </p>
        </div>
        <div className={`${glass} p-4`}>
          <Target className="size-5 text-white" />
          <p className="mt-3 font-medium text-sm">{m.winRate}</p>
          <p className="mt-0.5 text-white/70 text-xs">{interpolate(m.winRateValue, { value: percent.format(0.78) })}</p>
        </div>
      </div>
    </div>
  );
}
