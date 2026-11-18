"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { clusteringMessages } from "@/features/clustering/messages";
import type { ClusteringFilters as Filters } from "@/features/clustering/types";
import { TIER_LEVELS } from "@/lib/badminton/tiers";
import type { DataRange, Period } from "@/lib/clustering/period";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

import { PeriodPicker } from "./period-picker";

const MIN_MATCHES = [5, 10, 15, 20, 30];

/** Baris filter clustering. `period` = periode efektif dari hasil terakhir (default 24 bulan terakhir data). */
export function ClusteringFilters({
  value,
  period,
  range,
  fetching,
  canReset,
  onChange,
  onReset,
}: {
  readonly value: Filters;
  readonly period: Period | null;
  readonly range: DataRange | null;
  readonly fetching: boolean;
  readonly canReset: boolean;
  readonly onChange: (next: Filters) => void;
  readonly onReset: () => void;
}) {
  const m = useMessages(clusteringMessages).filters;
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PeriodPicker value={period} range={range} onChange={(next) => set(next)} />

      <Select value={String(value.minTier)} onValueChange={(next) => set({ minTier: Number(next) })}>
        <SelectTrigger size="sm" aria-label={m.tier} className="min-w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIER_LEVELS.map((level) => (
            <SelectItem key={level} value={String(level)}>
              {m.tiers[level]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(value.minMatches)} onValueChange={(next) => set({ minMatches: Number(next) })}>
        <SelectTrigger size="sm" aria-label={m.minMatches} className="min-w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MIN_MATCHES.map((count) => (
            <SelectItem key={count} value={String(count)}>
              {interpolate(m.minMatchesOption, { count })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.normalization}
        onValueChange={(next) => set({ normalization: next === "minmax" ? "minmax" : "zscore" })}
      >
        <SelectTrigger size="sm" aria-label={m.normalization} className="min-w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="zscore">{m.normalizations.zscore}</SelectItem>
          <SelectItem value="minmax">{m.normalizations.minmax}</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex h-7 items-center gap-2 border px-2.5">
        <Switch id="main-draw" checked={value.mainDraw} onCheckedChange={(checked) => set({ mainDraw: checked })} />
        <Label htmlFor="main-draw" className="font-normal text-xs">
          {m.mainDraw}
        </Label>
      </div>

      {canReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw data-icon="inline-start" />
          {m.reset}
        </Button>
      )}

      {fetching && (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs" role="status">
          <Spinner className="size-3.5" />
          {m.updating}
        </span>
      )}
    </div>
  );
}
