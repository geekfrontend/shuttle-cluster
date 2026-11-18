"use client";

import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { ChartLegend, ChartLegendContent } from "@/components/evilcharts/ui/recharts-legend";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClusteringOverview } from "@/features/clustering/hooks/use-clustering-overview";
import { clusteringMessages } from "@/features/clustering/messages";
import { dashboardMessages } from "@/features/dashboard/messages";
import { CATEGORY_CODES, CLUSTER_LEVELS, type ClusterLevel } from "@/lib/badminton/categories";
import { levelChartConfig } from "@/lib/clustering/chart";
import { useLocale, useMessages } from "@/lib/i18n/locale-provider";

type Row = { category: string } & Record<ClusterLevel, number>;

/** Jumlah unit tiap tingkat cluster per kategori (filter default), sebagai stacked bar. */
export function ClusterDistributionChart() {
  const m = useMessages(dashboardMessages).charts;
  const c = useMessages(clusteringMessages);
  const number = new Intl.NumberFormat(useLocale());
  const queries = useClusteringOverview(CATEGORY_CODES);
  const loading = queries.some((query) => query.isPending);
  const failed = queries.some((query) => query.isError);

  const levelNames = Object.fromEntries(CLUSTER_LEVELS.map((level) => [level, c.levels[level].name])) as Record<
    ClusterLevel,
    string
  >;
  const config = levelChartConfig(levelNames);
  const data: Row[] = CATEGORY_CODES.map((code, index) => {
    const clusters = queries[index]?.data?.result?.clusters ?? [];
    const sizeOf = (level: ClusterLevel) => clusters.find((cluster) => cluster.level === level)?.size ?? 0;
    return {
      category: code,
      dominant: sizeOf("dominant"),
      competitive: sizeOf("competitive"),
      developing: sizeOf("developing"),
    };
  });

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{m.distributionTitle}</CardTitle>
        <CardDescription>{m.distributionDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {failed && !loading ? (
          <p className="py-10 text-center text-muted-foreground text-xs">{m.failed}</p>
        ) : (
          <EvilBarChart
            data={data}
            config={config}
            stackType="stacked"
            isLoading={loading}
            loadingBars={5}
            className="aspect-auto h-64"
          >
            <EvilBarChart.Grid />
            <EvilBarChart.XAxis dataKey="category" />
            <EvilBarChart.YAxis tickFormatter={(value: number) => number.format(value)} />
            {/* Legend Recharts mengurutkan item menurut abjad; `itemSorter={null}` menjaga urutan Dominan → Berkembang. */}
            <ChartLegend
              verticalAlign="top"
              itemSorter={null}
              content={<ChartLegendContent align="left" selected={null} />}
            />
            <EvilBarChart.Tooltip />
            {CLUSTER_LEVELS.map((level) => (
              <EvilBarChart.Bar key={level} dataKey={level} variant="default" />
            ))}
          </EvilBarChart>
        )}
      </CardContent>
    </Card>
  );
}
