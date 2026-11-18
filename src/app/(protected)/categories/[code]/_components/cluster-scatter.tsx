"use client";

import { CartesianGrid, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";

import { ChartContainer } from "@/components/evilcharts/ui/recharts-chart";
import { ChartLegend, ChartLegendContent } from "@/components/evilcharts/ui/recharts-legend";
import { ChartTooltip } from "@/components/evilcharts/ui/recharts-tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clusteringMessages } from "@/features/clustering/messages";
import type { ClusteringOutput } from "@/features/clustering/types";
import { CLUSTER_LEVELS, type ClusterLevel } from "@/lib/badminton/categories";
import { LEVEL_COLOR, levelChartConfig } from "@/lib/clustering/chart";
import { useLocale, useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

import { type ClusterFormat, memberName, useClusterFormat } from "./cluster-format";
import { LevelDot } from "./cluster-level-badge";

type Point = {
  x: number;
  y: number;
  name: string;
  level: ClusterLevel;
  matches: number;
  centroid?: boolean;
};

/** Penanda centroid: tanda × dengan warna cluster dan garis tepi permukaan supaya terbaca di atas titik. */
function CentroidMark(props: { cx?: number; cy?: number; payload?: Point }) {
  const { cx = 0, cy = 0, payload } = props;
  const color = payload ? LEVEL_COLOR[payload.level] : "currentColor";
  const d = `M${cx - 6} ${cy - 6} L${cx + 6} ${cy + 6} M${cx + 6} ${cy - 6} L${cx - 6} ${cy + 6}`;
  return (
    <g>
      <path d={d} stroke="var(--card)" strokeWidth={5} strokeLinecap="round" />
      <path d={d} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

function PointTooltip({
  active,
  payload,
  format,
  labels,
}: {
  active?: boolean;
  payload?: { payload?: Point }[];
  format: ClusterFormat;
  labels: {
    winRate: string;
    pointDiff: string;
    matches: string;
    centroid: string;
    level: Record<ClusterLevel, string>;
  };
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="grid min-w-44 gap-1 border bg-background px-2.5 py-2 text-xs">
      <span className="flex items-center gap-1.5 font-medium">
        <LevelDot level={point.level} />
        {point.centroid ? `${labels.centroid} ${labels.level[point.level]}` : point.name}
      </span>
      {!point.centroid && <span className="text-muted-foreground">{labels.level[point.level]}</span>}
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 tabular-nums">
        <dt className="text-muted-foreground">{labels.winRate}</dt>
        <dd className="text-right font-mono">{format.percent(point.x)}</dd>
        <dt className="text-muted-foreground">{labels.pointDiff}</dt>
        <dd className="text-right font-mono">{format.signed(point.y)}</dd>
        {!point.centroid && (
          <>
            <dt className="text-muted-foreground">{labels.matches}</dt>
            <dd className="text-right font-mono">{format.integer(point.matches)}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

/**
 * Sebaran unit: win rate (x) × selisih poin per game (y), warna = cluster, × = centroid. Dua dari tiga fitur
 * clustering; rasio game menang sangat berkorelasi dengan win rate sehingga tidak menambah sumbu.
 */
export function ClusterScatter({ result, entity }: { readonly result: ClusteringOutput; readonly entity: string }) {
  const m = useMessages(clusteringMessages);
  const format = useClusterFormat();
  const tickPercent = new Intl.NumberFormat(useLocale(), { style: "percent", maximumFractionDigits: 0 });
  const levelNames = Object.fromEntries(CLUSTER_LEVELS.map((level) => [level, m.levels[level].name])) as Record<
    ClusterLevel,
    string
  >;
  const config = levelChartConfig(levelNames);

  const pointsOf = (level: ClusterLevel): Point[] =>
    result.members
      .filter((member) => member.level === level)
      .map((member) => ({
        x: member.features.winRate,
        y: member.features.pointDiffPerGame,
        name: memberName(member),
        level,
        matches: member.stats.matches,
      }));
  const centroids: Point[] = result.clusters.map((cluster) => ({
    x: cluster.centroid.winRate,
    y: cluster.centroid.pointDiffPerGame,
    name: cluster.level,
    level: cluster.level,
    matches: cluster.size,
    centroid: true,
  }));

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{m.charts.scatterTitle}</CardTitle>
        <CardDescription>{interpolate(m.charts.scatterDescription, { entity })}</CardDescription>
      </CardHeader>
      <CardContent>
        <figure aria-label={m.charts.scatterTitle}>
          <ChartContainer config={config} className="aspect-auto h-80">
            <ScatterChart margin={{ top: 8, right: 12, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, 1]}
                tickFormatter={(value: number) => tickPercent.format(value)}
                tickLine={false}
                axisLine={false}
                label={{
                  value: m.featureNames.winRate,
                  position: "insideBottom",
                  offset: -12,
                  className: "fill-muted-foreground text-xs",
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                tickFormatter={(value: number) => format.signed(value)}
                tickLine={false}
                axisLine={false}
                label={{
                  value: m.featureNames.pointDiffPerGame,
                  angle: -90,
                  position: "left",
                  offset: 4,
                  style: { textAnchor: "middle" },
                  className: "fill-muted-foreground text-xs",
                }}
              />
              <ZAxis range={[64, 64]} />
              <ReferenceLine y={0} stroke="var(--border)" />
              <ReferenceLine x={0.5} stroke="var(--border)" />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={
                  <PointTooltip
                    format={format}
                    labels={{
                      winRate: m.featureNames.winRate,
                      pointDiff: m.featureNames.pointDiffPerGame,
                      matches: m.calc.matches,
                      centroid: m.calc.centroid,
                      level: levelNames,
                    }}
                  />
                }
              />
              <ChartLegend
                verticalAlign="top"
                itemSorter={null}
                content={<ChartLegendContent align="left" selected={null} />}
              />
              {CLUSTER_LEVELS.map((level) => (
                <Scatter
                  key={level}
                  name={level}
                  data={pointsOf(level)}
                  fill={`var(--color-${level}-0)`}
                  fillOpacity={0.85}
                  stroke="var(--card)"
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
              ))}
              <Scatter
                name="centroid"
                data={centroids}
                legendType="none"
                shape={<CentroidMark />}
                isAnimationActive={false}
              />
            </ScatterChart>
          </ChartContainer>
          <figcaption className="mt-2 text-[0.625rem] text-muted-foreground">{m.charts.scatterCaption}</figcaption>
        </figure>
      </CardContent>
    </Card>
  );
}
