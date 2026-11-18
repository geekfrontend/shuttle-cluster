"use client";

import { useTable } from "@tanstack/react-table";
import { Users } from "lucide-react";

import { useUsers } from "@/features/users/hooks/use-users";
import { usersMessages } from "@/features/users/messages";
import type { User, UserRole, UserStatus } from "@/features/users/types";
import { workspaceMessages } from "@/features/workspace/messages";
import { useFormatters } from "@/hooks/use-formatters";
import { dataTableFeatures } from "@/lib/data-table-features";
import { useMessages } from "@/lib/i18n/locale-provider";

import { DataTable } from "../../_components/data-table/data-table";
import { DataTableFacetedFilter } from "../../_components/data-table/data-table-faceted-filter";
import { DataTableToolbar } from "../../_components/data-table/data-table-toolbar";
import { useServerTableState } from "../../_components/data-table/use-server-table-state";
import { useWorkspace } from "../../_components/workspace/workspace-provider";
import { AddUserDialog } from "./add-user-dialog";
import { createUserColumns } from "./users-columns";

const EMPTY: User[] = [];

export function UsersScreen() {
  const m = useMessages(usersMessages);
  const w = useMessages(workspaceMessages);
  const format = useFormatters();
  const { user: me } = useWorkspace();
  const state = useServerTableState({ columnVisibility: { lastActive: false } });

  const query = useUsers({
    ...state.page,
    q: state.query,
    role: state.filterOf("role") as UserRole[] | undefined,
    status: state.filterOf("status") as UserStatus[] | undefined,
  });

  const columns = createUserColumns({ m, w, format, meId: me.id });

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
        <AddUserDialog />
      </div>

      <DataTable
        table={table}
        loading={query.isPending}
        fetching={query.isFetching || state.searchPending}
        error={query.isError ? query.error.message || w.common.loadFailed : null}
        onRetry={() => query.refetch()}
        empty={{ icon: Users, title: m.list.empty, description: m.list.emptyDescription }}
        search={state.search}
        onSearchChange={state.setSearch}
        toolbar={
          <DataTableToolbar
            table={table}
            search={state.search}
            onSearchChange={state.setSearch}
            searchPlaceholder={m.list.searchPlaceholder}
            columnLabels={{
              role: columnLabels.role,
              status: columnLabels.status,
              lastActive: columnLabels.lastActive,
              created: columnLabels.created,
            }}
          >
            <DataTableFacetedFilter
              table={table}
              columnId="role"
              title={m.list.role}
              options={[
                { value: "admin", label: w.roles.admin },
                { value: "user", label: w.roles.user },
              ]}
            />
            <DataTableFacetedFilter
              table={table}
              columnId="status"
              title={m.list.status}
              options={[
                { value: "active", label: w.status.active },
                { value: "locked", label: w.status.locked },
                { value: "deactivated", label: w.status.deactivated },
              ]}
            />
          </DataTableToolbar>
        }
      />
    </div>
  );
}
