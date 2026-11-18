"use client";

import { useTable } from "@tanstack/react-table";
import { Contact } from "lucide-react";

import { usePlayers } from "@/features/players/hooks/use-players";
import { playersMessages } from "@/features/players/messages";
import type { Gender, Player } from "@/features/players/types";
import { workspaceMessages } from "@/features/workspace/messages";
import { useFormatters } from "@/hooks/use-formatters";
import { dataTableFeatures } from "@/lib/data-table-features";
import { useMessages } from "@/lib/i18n/locale-provider";

import { DataTable } from "../../_components/data-table/data-table";
import { DataTableFacetedFilter } from "../../_components/data-table/data-table-faceted-filter";
import { DataTableToolbar } from "../../_components/data-table/data-table-toolbar";
import { useServerTableState } from "../../_components/data-table/use-server-table-state";
import { useIsAdmin } from "../../_components/workspace/workspace-provider";
import { PlayerFormDialog } from "./player-form-dialog";
import { createPlayerColumns } from "./players-columns";

const EMPTY: Player[] = [];

export function PlayersScreen() {
  const m = useMessages(playersMessages);
  const w = useMessages(workspaceMessages);
  const format = useFormatters();
  const isAdmin = useIsAdmin();
  const state = useServerTableState({ columnVisibility: { externalId: false, created: false } });

  const query = usePlayers({
    ...state.page,
    q: state.query,
    gender: state.filterOf("gender") as Gender[] | undefined,
  });

  const columns = createPlayerColumns({ m, w, format, isAdmin });

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
        {isAdmin && <PlayerFormDialog />}
      </div>

      <DataTable
        table={table}
        loading={query.isPending}
        fetching={query.isFetching || state.searchPending}
        error={query.isError ? query.error.message || w.common.loadFailed : null}
        onRetry={() => query.refetch()}
        empty={{ icon: Contact, title: m.list.empty, description: m.list.emptyDescription }}
        search={state.search}
        onSearchChange={state.setSearch}
        toolbar={
          <DataTableToolbar
            table={table}
            search={state.search}
            onSearchChange={state.setSearch}
            searchPlaceholder={m.list.searchPlaceholder}
            columnLabels={{
              gender: columnLabels.gender,
              country: columnLabels.country,
              matches: columnLabels.matches,
              externalId: columnLabels.externalId,
              created: columnLabels.created,
            }}
          >
            <DataTableFacetedFilter
              table={table}
              columnId="gender"
              title={m.list.gender}
              options={[
                { value: "male", label: m.genders.male },
                { value: "female", label: m.genders.female },
              ]}
            />
          </DataTableToolbar>
        }
      />
    </div>
  );
}
