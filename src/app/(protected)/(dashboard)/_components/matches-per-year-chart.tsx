"use client";

import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardMessages } from "@/features/dashboard/messages";
import { neutralSeries } from "@/lib/clustering/chart";
import { useLocale, useMessages } from "@/lib/i18n/locale-provider";

/** Jumlah pertandingan per tahun di database (semua kategori). Satu seri → tanpa legend, warna netral. */
export function MatchesPerYearChart({ data }: { readonly data: { year: number; matches: number }[] }) {
  const m = useMessages(dashboardMessages).charts;
  const number = new Intl.NumberFormat(useLocale());
  const rows = data.map((row) => ({ year: String(row.year), matches: row.matches }));

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{m.matchesTitle}</CardTitle>
        <CardDescription>{m.matchesDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground text-xs">{m.noMatches}</p>
        ) : (
          <EvilBarChart data={rows} config={{ matches: neutralSeries(m.matches) }} className="aspect-auto h-56">
            <EvilBarChart.Grid />
            <EvilBarChart.XAxis dataKey="year" tickFormatter={(year: string) => `'${year.slice(2)}`} />
            <EvilBarChart.YAxis tickFormatter={(value: number) => number.format(value)} />
            <EvilBarChart.Tooltip />
            <EvilBarChart.Bar dataKey="matches" variant="default" />
          </EvilBarChart>
        )}
      </CardContent>
    </Card>
  );
}
