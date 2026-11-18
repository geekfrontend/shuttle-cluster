"use client";

import { Badge } from "@/components/shared/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clusteringMessages } from "@/features/clustering/messages";
import type { ClusterSummary } from "@/features/clustering/types";
import { useMessages } from "@/lib/i18n/locale-provider";

import { useClusterFormat } from "./cluster-format";
import { LEVEL_TONE } from "./cluster-level-badge";

/** Tiga kartu cluster (Dominan, Kompetitif, Berkembang): jumlah anggota dan centroid dalam satuan asli. */
export function ClusterLevelCards({
  clusters,
  entity,
}: {
  readonly clusters: ClusterSummary[];
  /** Sebutan unit: pemain (tunggal) atau pasangan (ganda). */
  readonly entity: string;
}) {
  const m = useMessages(clusteringMessages);
  const format = useClusterFormat();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {clusters.map(({ level, size, centroid }) => {
        const copy = m.levels[level];
        const stats = [
          { label: m.featureNames.winRate, value: format.percent(centroid.winRate) },
          { label: m.featureNames.gameWinRate, value: format.percent(centroid.gameWinRate) },
          { label: m.featureNames.pointDiffPerGame, value: format.signed(centroid.pointDiffPerGame) },
        ];
        return (
          <Card key={level}>
            <CardHeader className="gap-1.5 border-b">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">{copy.name}</CardTitle>
                <Badge tone={LEVEL_TONE[level]}>{copy.tier}</Badge>
              </div>
              <CardDescription>{copy.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="flex items-baseline gap-1.5">
                <span className="font-medium text-3xl tabular-nums tracking-tight">{format.integer(size)}</span>
                <span className="text-muted-foreground text-xs">{entity}</span>
              </p>
              <dl className="grid grid-cols-3 gap-2 border-t pt-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="grid gap-0.5">
                    <dt className="text-[0.625rem] text-muted-foreground leading-tight">{stat.label}</dt>
                    <dd className="font-medium text-sm tabular-nums">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
