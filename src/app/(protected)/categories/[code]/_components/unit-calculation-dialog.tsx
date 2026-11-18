"use client";

import type { ReactNode } from "react";

import { cn } from "cn";
import { Calculator } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clusteringMessages } from "@/features/clustering/messages";
import type { ClusterMember, ClusterSummary } from "@/features/clustering/types";
import { FEATURE_KEYS } from "@/lib/clustering/features";
import type { NormalizeStats } from "@/lib/clustering/kmeans";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

import { memberName, useClusterFormat } from "./cluster-format";
import { ClusterLevelBadge } from "./cluster-level-badge";

export type CalculationContext = { clusters: ClusterSummary[]; normalization: NormalizeStats };

const cell = "text-right font-mono text-xs tabular-nums";

/**
 * Perhitungan satu unit langkah demi langkah: data mentah → fitur → normalisasi → jarak ke tiap centroid →
 * cluster terdekat → silhouette. Semua angka berasal dari server (tidak dihitung ulang di browser).
 */
export function UnitCalculationDialog({
  member,
  context,
}: {
  readonly member: ClusterMember;
  readonly context: CalculationContext;
}) {
  const m = useMessages(clusteringMessages);
  const c = m.calc;
  const format = useClusterFormat();
  const name = memberName(member);
  const { stats } = member;
  const { normalization } = context;
  const nearest = member.distances.indexOf(Math.min(...member.distances));

  const featureValue = (key: (typeof FEATURE_KEYS)[number]) =>
    key === "pointDiffPerGame" ? format.signed(member.features[key]) : format.percent(member.features[key]);
  const raw = (key: (typeof FEATURE_KEYS)[number]) => format.decimal(member.features[key], 4);
  const working: Record<(typeof FEATURE_KEYS)[number], string> = {
    winRate: `${stats.wins} ÷ ${stats.matches}`,
    gameWinRate: `${stats.gamesWon} ÷ ${stats.games}`,
    pointDiffPerGame: `(${stats.pointsFor} − ${stats.pointsAgainst}) ÷ ${stats.games}`,
  };

  let silhouetteNote = c.silhouetteGood;
  if (member.silhouette < 0) silhouetteNote = c.silhouetteBad;
  else if (member.silhouette < 0.25) silhouetteNote = c.silhouetteBorder;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          aria-label={interpolate(m.members.viewCalculationOf, { name })}
          title={m.members.viewCalculation}
        >
          <Calculator />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{interpolate(c.title, { name })}</DialogTitle>
          <DialogDescription>{interpolate(c.description, { level: m.levels[member.level].name })}</DialogDescription>
        </DialogHeader>

        <Step title={c.step1}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            {[
              [c.matches, stats.matches],
              [c.wins, stats.wins],
              [c.losses, stats.matches - stats.wins],
              [c.games, stats.games],
              [c.gamesWon, stats.gamesWon],
              [c.pointsFor, stats.pointsFor],
              [c.pointsAgainst, stats.pointsAgainst],
            ].map(([label, value]) => (
              <div key={String(label)} className="grid gap-0.5">
                <dt className="text-[0.625rem] text-muted-foreground">{label}</dt>
                <dd className="font-medium text-sm tabular-nums">{format.integer(Number(value))}</dd>
              </div>
            ))}
          </dl>
        </Step>

        <Step title={c.step2}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{c.feature}</TableHead>
                <TableHead>{c.formulaLabel}</TableHead>
                <TableHead className="text-right">{c.value}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FEATURE_KEYS.map((key) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{m.featureNames[key]}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    <span className="block">{c.formulas[key]}</span>
                    <span className="block font-mono">
                      {working[key]} = {raw(key)}
                    </span>
                  </TableCell>
                  <TableCell className={cell}>{featureValue(key)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Step>

        <Step title={`${c.step3} (${m.filters.normalizations[normalization.method]})`}>
          <p className="text-muted-foreground text-xs">
            {normalization.method === "zscore" ? c.zscoreFormula : c.minmaxFormula}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{c.feature}</TableHead>
                <TableHead className="text-right">x</TableHead>
                {normalization.method === "zscore" ? (
                  <>
                    <TableHead className="text-right">μ</TableHead>
                    <TableHead className="text-right">σ</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-right">min</TableHead>
                    <TableHead className="text-right">max</TableHead>
                  </>
                )}
                <TableHead className="text-right">{c.normalized}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FEATURE_KEYS.map((key, j) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{m.featureNames[key]}</TableCell>
                  <TableCell className={cell}>{raw(key)}</TableCell>
                  {normalization.method === "zscore" ? (
                    <>
                      <TableCell className={cell}>{format.decimal(normalization.mean[j] ?? 0, 4)}</TableCell>
                      <TableCell className={cell}>{format.decimal(normalization.sd[j] ?? 0, 4)}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className={cell}>{format.decimal(normalization.min[j] ?? 0, 4)}</TableCell>
                      <TableCell className={cell}>{format.decimal(normalization.max[j] ?? 0, 4)}</TableCell>
                    </>
                  )}
                  <TableCell className={cn(cell, "font-semibold")}>
                    {format.decimal(member.normalized[j] ?? 0, 4)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Step>

        <Step title={c.step4}>
          <p className="text-muted-foreground text-xs">{c.distanceFormula}</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{m.members.level}</TableHead>
                <TableHead>{c.centroid}</TableHead>
                <TableHead>{c.working}</TableHead>
                <TableHead className="text-right">d</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {context.clusters.map((cluster, index) => {
                const squares = cluster.normalizedCentroid.map(
                  (value, j) => ((member.normalized[j] ?? 0) - value) ** 2,
                );
                const isNearest = index === nearest;
                return (
                  <TableRow key={cluster.level} className={cn(isNearest && "bg-primary/5 hover:bg-primary/5")}>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <ClusterLevelBadge level={cluster.level} />
                        {isNearest && (
                          <Badge tone="accent" emphasis="tint">
                            {c.nearest}
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs tabular-nums">
                      ({cluster.normalizedCentroid.map((value) => format.decimal(value)).join("; ")})
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs tabular-nums">
                      √({squares.map((value) => format.decimal(value)).join(" + ")})
                    </TableCell>
                    <TableCell className={cn(cell, isNearest && "font-semibold text-foreground")}>
                      {format.decimal(member.distances[index] ?? 0)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="text-xs">{interpolate(c.assigned, { level: m.levels[member.level].name })}</p>
        </Step>

        <Step title={c.step5}>
          <p className="font-mono text-muted-foreground text-xs">{c.silhouetteFormula}</p>
          <dl className="grid gap-2 text-xs">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">
                {interpolate(c.silhouetteA, { level: m.levels[member.level].name })}
              </dt>
              <dd className="font-mono tabular-nums">{format.decimal(member.silhouetteA)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">
                {interpolate(c.silhouetteB, { level: member.neighbor ? m.levels[member.neighbor].name : "—" })}
              </dt>
              <dd className="font-mono tabular-nums">{format.decimal(member.silhouetteB)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t pt-2">
              <dt className="font-mono text-muted-foreground">
                s = ({format.decimal(member.silhouetteB)} − {format.decimal(member.silhouetteA)}) ÷{" "}
                {format.decimal(Math.max(member.silhouetteA, member.silhouetteB))}
              </dt>
              <dd className="font-mono font-semibold tabular-nums">{format.decimal(member.silhouette)}</dd>
            </div>
          </dl>
          <p className="text-muted-foreground text-xs">{silhouetteNote}</p>
        </Step>
      </DialogContent>
    </Dialog>
  );
}

function Step({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="grid gap-2 border-t pt-4">
      <h4 className="font-medium text-sm">{title}</h4>
      {children}
    </section>
  );
}
