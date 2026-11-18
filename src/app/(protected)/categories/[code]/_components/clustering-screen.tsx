"use client";

import { useState } from "react";

import { Calculator, ChartScatter, CircleAlert, FileSpreadsheet, LayoutGrid, Users } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useClustering } from "@/features/clustering/hooks/use-clustering";
import { clusteringMessages } from "@/features/clustering/messages";
import {
  type ClusteringResult,
  DEFAULT_CLUSTERING_FILTERS,
  type ClusteringFilters as Filters,
} from "@/features/clustering/types";
import type { Category } from "@/lib/badminton/categories";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

import { PageTabs } from "../../../_components/page-tabs";
import { useClusterFormat } from "./cluster-format";
import { ClusterLevelCards } from "./cluster-level-cards";
import { ClusteringFilters } from "./clustering-filters";
import { MembersTable } from "./members-table";
import { MethodDetails } from "./method-details";
import { QualityStats } from "./quality-stats";

const isDefault = (filters: Filters) =>
  filters.from === undefined &&
  filters.to === undefined &&
  filters.mainDraw === DEFAULT_CLUSTERING_FILTERS.mainDraw &&
  filters.minTier === DEFAULT_CLUSTERING_FILTERS.minTier &&
  filters.minMatches === DEFAULT_CLUSTERING_FILTERS.minMatches &&
  filters.normalization === DEFAULT_CLUSTERING_FILTERS.normalization;

/**
 * Hasil clustering satu kategori dengan filter periode, level turnamen, minimal pertandingan, main draw, dan
 * normalisasi. `initialData` = hasil filter default yang sudah dihitung di server.
 */
export function ClusteringScreen({
  category,
  initialData,
  initialTab,
}: {
  readonly category: Category;
  readonly initialData: ClusteringResult;
  readonly initialTab?: string;
}) {
  const m = useMessages(clusteringMessages);
  const format = useClusterFormat();
  const [filters, setFilters] = useState<Filters>(DEFAULT_CLUSTERING_FILTERS);
  // Data awal dari server hanya berlaku untuk filter default; filter lain diambil dari API.
  const query = useClustering({ category: category.code, ...filters }, isDefault(filters) ? initialData : undefined);
  const data = query.data;
  const copy = m.categories[category.code];
  const entity = m.entities[category.format];

  if (!data) {
    return query.isError ? <LoadError message={query.error.message || m.filters.loadFailed} /> : null;
  }

  const { params, summary, result, dataRange } = data;
  const period = params.from && params.to ? { from: params.from, to: params.to } : null;
  const periodText = period ? { from: format.date(period.from), to: format.date(period.to) } : { from: "", to: "" };

  if (!dataRange) {
    return (
      <Empty className="min-h-72 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileSpreadsheet />
          </EmptyMedia>
          <EmptyTitle>{m.detail.emptyTitle}</EmptyTitle>
          <EmptyDescription>{interpolate(m.detail.emptyDescription, { category: copy.name })}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <ClusteringFilters
          value={filters}
          period={period}
          range={dataRange}
          fetching={query.isFetching}
          canReset={!isDefault(filters)}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_CLUSTERING_FILTERS)}
        />
        <p className="text-muted-foreground text-xs tabular-nums">
          {interpolate(m.detail.periodSummary, {
            ...periodText,
            matches: format.integer(summary.matches),
            eligible: format.integer(summary.eligibleUnits),
            units: format.integer(summary.units),
            entity,
            minMatches: params.minMatches,
          })}
        </p>
      </div>

      {query.isError && <LoadError message={query.error.message || m.filters.loadFailed} />}

      {result ? (
        <PageTabs
          initialTab={initialTab}
          tabs={[
            {
              value: "summary",
              label: m.tabs.summary,
              icon: <LayoutGrid />,
              content: (
                <>
                  <div>
                    <h3 className="font-medium text-base">{m.detail.levelsTitle}</h3>
                    <p className="text-muted-foreground text-sm">{m.detail.levelsDescription}</p>
                  </div>
                  <ClusterLevelCards clusters={result.clusters} entity={entity} />
                  <QualityStats quality={result.quality} />
                </>
              ),
            },
            {
              value: "members",
              label: `${m.tabs.members} (${format.integer(result.members.length)})`,
              icon: <Users />,
              content: <MembersTable result={result} />,
            },
            {
              value: "calculation",
              label: m.tabs.calculation,
              icon: <Calculator />,
              content: <MethodDetails result={result} k={params.k} />,
            },
          ]}
        />
      ) : (
        <Empty className="min-h-56 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ChartScatter />
            </EmptyMedia>
            <EmptyTitle>{m.detail.notEnoughTitle}</EmptyTitle>
            <EmptyDescription>
              {interpolate(m.detail.notEnoughDescription, {
                ...periodText,
                eligible: format.integer(summary.eligibleUnits),
                entity,
                minMatches: params.minMatches,
              })}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}

function LoadError({ message }: { readonly message: string }) {
  return (
    <Alert variant="soft-destructive">
      <CircleAlert aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
