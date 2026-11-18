"use client";

import { useTable } from "@tanstack/react-table";
import { Swords } from "lucide-react";

import { clusteringMessages } from "@/features/clustering/messages";
import { useMatches } from "@/features/matches/hooks/use-matches";
import { matchesMessages } from "@/features/matches/messages";
import type { Match } from "@/features/matches/types";
import { workspaceMessages } from "@/features/workspace/messages";
import { useFormatters } from "@/hooks/use-formatters";
import { CATEGORIES, type CategoryCode } from "@/lib/badminton/categories";
import { dataTableFeatures } from "@/lib/data-table-features";
import { useMessages } from "@/lib/i18n/locale-provider";

import { DataTable } from "../../_components/data-table/data-table";
import { DataTableFacetedFilter } from "../../_components/data-table/data-table-faceted-filter";
import { DataTableToolbar } from "../../_components/data-table/data-table-toolbar";
import { useServerTableState } from "../../_components/data-table/use-server-table-state";
import { useIsAdmin } from "../../_components/workspace/workspace-provider";
import { MatchFormDialog } from "./match-form-dialog";
import { createMatchColumns } from "./matches-columns";

const EMPTY: Match[] = [];

export function MatchesScreen() {
  const m = useMessages(matchesMessages);
  const c = useMessages(clusteringMessages);
  const w = useMessages(workspaceMessages);
  const format = useFormatters();
  const isAdmin = useIsAdmin();
  const state = useServerTableState();

  const query = useMatches({
    ...state.page,
    q: state.query,
    category: state.filterOf("category") as CategoryCode[] | undefined,
  });

  const columns = createMatchColumns({ m, c, w, format, isAdmin });

  const table = useTable({
    features: dataTableFeatures,
    data: query.data?.items ?? EMPTY,
    columns,
    state: {
      pagination: state.pagination,
      columnFilters: state.columnFilters,
      columnVisibility: state.columnVisibility,
    },
    rowCount: query.data?.total ?? 0,
    manualPagination: true,
    manualFiltering: true,
    getRowId: (row) => row.id,
    onPaginationChange: state.onPaginationChange,
    onColumnFiltersChange: state.onColumnFiltersChange,
    onColumnVisibilityChange: state.onColumnVisibilityChange,
  });

  const columnLabels = m.list.columns;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl tracking-tight">{m.list.title}</h2>
          <p className="text-muted-foreground">{m.list.description}</p>
        </div>
        {isAdmin && <MatchFormDialog />}
      </div>

      <DataTable
        table={table}
        loading={query.isPending}
        fetching={query.isFetching || state.searchPending}
        error={query.isError ? query.error.message || w.common.loadFailed : null}
        onRetry={() => query.refetch()}
        empty={{ icon: Swords, title: m.list.empty, description: m.list.emptyDescription }}
        search={state.search}
        onSearchChange={state.setSearch}
        toolbar={
          <DataTableToolbar
            table={table}
            search={state.search}
            onSearchChange={state.setSearch}
            searchPlaceholder={m.list.searchPlaceholder}
            columnLabels={{
              playedOn: columnLabels.playedOn,
              category: columnLabels.category,
              tournament: columnLabels.tournament,
              sideA: columnLabels.sideA,
              sideB: columnLabels.sideB,
              score: columnLabels.score,
              status: columnLabels.status,
            }}
          >
            <DataTableFacetedFilter
              table={table}
              columnId="category"
              title={m.list.category}
              options={CATEGORIES.map((category) => ({
                value: category.code,
                label: `${category.code} · ${c.categories[category.code].name}`,
              }))}
            />
          </DataTableToolbar>
        }
      />
    </div>
  );
}
