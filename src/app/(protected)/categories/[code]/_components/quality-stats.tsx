"use client";

import { Card, CardContent } from "@/components/ui/card";
import { clusteringMessages } from "@/features/clustering/messages";
import type { ClusteringOutput } from "@/features/clustering/types";
import { useMessages } from "@/lib/i18n/locale-provider";

import { useClusterFormat } from "./cluster-format";

/** Kualitas hasil: silhouette rata-rata, WCSS, dan jumlah iterasi sampai konvergen. */
export function QualityStats({ quality }: { readonly quality: ClusteringOutput["quality"] }) {
  const m = useMessages(clusteringMessages).quality;
  const format = useClusterFormat();
  const items = [
    { label: m.silhouette, value: format.decimal(quality.silhouette), hint: m.silhouetteHint },
    { label: m.wcss, value: format.decimal(quality.wcss, 2), hint: m.wcssHint },
    { label: m.iterations, value: format.integer(quality.iterations), hint: m.iterationsHint },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardContent className="grid gap-0.5">
            <span className="text-muted-foreground text-xs">{item.label}</span>
            <span className="font-medium text-xl tabular-nums tracking-tight">{item.value}</span>
            <span className="text-[0.625rem] text-muted-foreground">{item.hint}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
