"use client";

import { ReferenceLine } from "recharts";

import { EvilLineChart } from "@/components/evilcharts/charts/recharts-line-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clusteringMessages } from "@/features/clustering/messages";
import type { ClusteringOutput } from "@/features/clustering/types";
import { neutralSeries } from "@/lib/clustering/chart";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

import { useClusterFormat } from "./cluster-format";

/**
 * Dasar pemilihan K: WCSS (metode Elbow) dan rata-rata silhouette per K, dua chart terpisah karena skalanya
 * berbeda (tidak memakai dua sumbu Y). K yang dipakai ditandai garis vertikal.
 */
export function KEvaluationCharts({ result, k }: { readonly result: ClusteringOutput; readonly k: number }) {
  const m = useMessages(clusteringMessages);
  const format = useClusterFormat();
  const kLabel = (value: number) => interpolate(m.charts.kTick, { k: value });

  const wcss = result.evaluation.map((row) => ({ k: kLabel(row.k), wcss: Number(row.wcss.toFixed(2)) }));
  const silhouette = result.evaluation
    .filter((row) => row.k > 1)
    .map((row) => ({ k: kLabel(row.k), silhouette: Number(row.silhouette.toFixed(3)) }));
  const used = kLabel(k);
  const marker = (
    <ReferenceLine
      x={used}
      stroke="var(--foreground)"
      strokeDasharray="4 4"
      label={{ value: m.charts.kUsed, position: "insideTopRight", className: "fill-muted-foreground text-[0.625rem]" }}
    />
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>{m.charts.elbowTitle}</CardTitle>
          <CardDescription>{m.charts.elbowDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <EvilLineChart data={wcss} config={{ wcss: neutralSeries(m.quality.wcss) }} className="aspect-auto h-56">
            <EvilLineChart.Grid />
            <EvilLineChart.XAxis dataKey="k" />
            <EvilLineChart.YAxis tickFormatter={(value: number) => format.decimal(value, 0)} />
            <EvilLineChart.Tooltip />
            {marker}
            <EvilLineChart.Line dataKey="wcss" strokeVariant="solid">
              <EvilLineChart.Dot variant="border" />
              <EvilLineChart.ActiveDot variant="colored-border" />
            </EvilLineChart.Line>
          </EvilLineChart>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>{m.charts.silhouetteTitle}</CardTitle>
          <CardDescription>{m.charts.silhouetteDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <EvilLineChart
            data={silhouette}
            config={{ silhouette: neutralSeries(m.quality.silhouette) }}
            className="aspect-auto h-56"
          >
            <EvilLineChart.Grid />
            <EvilLineChart.XAxis dataKey="k" />
            <EvilLineChart.YAxis tickFormatter={(value: number) => format.decimal(value, 2)} />
            <EvilLineChart.Tooltip />
            {marker}
            <EvilLineChart.Line dataKey="silhouette" strokeVariant="solid">
              <EvilLineChart.Dot variant="border" />
              <EvilLineChart.ActiveDot variant="colored-border" />
            </EvilLineChart.Line>
          </EvilLineChart>
        </CardContent>
      </Card>
    </div>
  );
}
