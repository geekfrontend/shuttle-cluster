import { cn } from "cn";

import { ShinyText } from "./shiny-text";

/**
 * Tampilan loading aplikasi: logo, nama brand dengan kilau, dan label status. Dipakai oleh
 * `loading.tsx` (fallback Suspense Next.js). Label dikirim lewat props — komponen shared tanpa i18n.
 *
 * `fullScreen`: memenuhi viewport (pemuatan pertama / halaman publik). Tanpa itu, mengisi area konten
 * di dalam layout supaya sidebar & header tetap terlihat.
 */
export function AppLoading({
  brand,
  fullScreen = false,
}: {
  readonly brand: string;
  readonly label: string;
  readonly fullScreen?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        fullScreen ? "min-h-dvh bg-background" : "min-h-[60vh]",
      )}
    >
      <ShinyText text={brand} speed={1} className="font-semibold text-2xl tracking-tight" />
    </div>
  );
}
