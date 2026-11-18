"use client";

import type { ReactNode } from "react";

import { cn } from "cn";

import { Badge } from "@/components/shared/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clusteringMessages } from "@/features/clustering/messages";
import type { ClusteringOutput } from "@/features/clustering/types";
import { FEATURE_KEYS, type FeatureKey, type UnitFeatures } from "@/lib/clustering/features";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

import { useClusterFormat } from "./cluster-format";
import { ClusterLevelBadge } from "./cluster-level-badge";
import { KEvaluationCharts } from "./k-evaluation-charts";

const num = "text-right font-mono text-xs tabular-nums";

/** Tab Perhitungan: parameter normalisasi, centroid akhir, centroid per iterasi, dan evaluasi K = 1–6. */
export function MethodDetails({ result, k }: { readonly result: ClusteringOutput; readonly k: number }) {
  const m = useMessages(clusteringMessages);
  const t = m.method;
  const format = useClusterFormat();
  const { normalization } = result;

  const featureValue = (features: UnitFeatures, key: FeatureKey) =>
    key === "pointDiffPerGame" ? format.signed(features[key]) : format.percent(features[key]);

  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground text-xs">
        {interpolate(t.settings, { restarts: result.restarts, seed: result.seed })}
      </p>

      <Section title={t.normalizationTitle} description={t.normalizationDescription}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{m.calc.feature}</TableHead>
              <TableHead className="text-right">{normalization.method === "zscore" ? t.mean : t.min}</TableHead>
              <TableHead className="text-right">{normalization.method === "zscore" ? t.sd : t.max}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FEATURE_KEYS.map((key, j) => (
              <TableRow key={key}>
                <TableCell className="font-medium">{m.featureNames[key]}</TableCell>
                <TableCell className={num}>
                  {format.decimal(
                    (normalization.method === "zscore" ? normalization.mean[j] : normalization.min[j]) ?? 0,
                    4,
                  )}
                </TableCell>
                <TableCell className={num}>
                  {format.decimal(
                    (normalization.method === "zscore" ? normalization.sd[j] : normalization.max[j]) ?? 0,
                    4,
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section title={t.centroidsTitle} description={t.centroidsDescription}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{m.members.level}</TableHead>
              {FEATURE_KEYS.map((key) => (
                <TableHead key={key} className="text-right">
                  {m.featureNames[key]}
                </TableHead>
              ))}
              <TableHead className="text-right">{m.calc.normalized}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.clusters.map((cluster) => (
              <TableRow key={cluster.level}>
                <TableCell>
                  <ClusterLevelBadge level={cluster.level} />
                </TableCell>
                {FEATURE_KEYS.map((key) => (
                  <TableCell key={key} className={num}>
                    {featureValue(cluster.centroid, key)}
                  </TableCell>
                ))}
                <TableCell className={cn(num, "text-muted-foreground")}>
                  ({cluster.normalizedCentroid.map((value) => format.decimal(value)).join("; ")})
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section title={t.iterationsTitle} description={t.iterationsDescription}>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>{t.iteration}</TableHead>
                {result.clusters.map((cluster) => (
                  <TableHead key={cluster.level}>
                    <ClusterLevelBadge level={cluster.level} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.history.map((step, iteration) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: urutan iterasi tetap
                <TableRow key={iteration}>
                  <TableCell className="font-mono text-xs tabular-nums">{iteration}</TableCell>
                  {step.map((centroid, cluster) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: urutan cluster tetap (Dominan → Berkembang)
                    <TableCell key={cluster} className="font-mono text-muted-foreground text-xs tabular-nums">
                      {FEATURE_KEYS.map((key) => featureValue(centroid, key)).join(" · ")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      <KEvaluationCharts result={result} k={k} />

      <Section title={t.evaluationTitle} description={t.evaluationDescription}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.k}</TableHead>
              <TableHead className="text-right">{m.quality.wcss}</TableHead>
              <TableHead className="text-right">{m.quality.silhouette}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.evaluation.map((row) => (
              <TableRow key={row.k} className={cn(row.k === k && "bg-primary/5 hover:bg-primary/5")}>
                <TableCell className="font-mono text-xs tabular-nums">{row.k}</TableCell>
                <TableCell className={num}>{format.decimal(row.wcss, 2)}</TableCell>
                <TableCell className={num}>{row.k === 1 ? "—" : format.decimal(row.silhouette)}</TableCell>
                <TableCell className="text-right">
                  {row.k === k && (
                    <Badge tone="accent" emphasis="tint">
                      {t.used}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
