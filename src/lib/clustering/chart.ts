import type { ChartConfig } from "@/components/evilcharts/ui/recharts-chart";
import { CLUSTER_LEVELS, type ClusterLevel } from "@/lib/badminton/categories";

/*
 * Warna chart & penanda tingkat cluster. Nilainya token tema di `globals.css` (light & dark), sehingga
 * badge, legend, dan titik scatter selalu memakai warna yang sama untuk tingkat yang sama.
 */
export const LEVEL_COLOR: Record<ClusterLevel, string> = {
  dominant: "var(--chart-dominant)",
  competitive: "var(--chart-competitive)",
  developing: "var(--chart-developing)",
};

/** Seri tunggal tanpa identitas (mis. WCSS per K): warna netral, bukan warna salah satu cluster. */
export const NEUTRAL_SERIES = "var(--muted-foreground)";

export function levelChartConfig(labels: Record<ClusterLevel, string>) {
  return Object.fromEntries(
    CLUSTER_LEVELS.map((level) => [
      level,
      { label: labels[level], colors: { light: [LEVEL_COLOR[level]], dark: [LEVEL_COLOR[level]] } },
    ]),
  ) as Record<ClusterLevel, ChartConfig[string]>;
}

export function neutralSeries(label: string): ChartConfig[string] {
  return { label, colors: { light: [NEUTRAL_SERIES], dark: [NEUTRAL_SERIES] } };
}
