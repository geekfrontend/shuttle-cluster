"use client";

import { useState } from "react";

import { type ColumnFiltersState, type PaginationState, useTable } from "@tanstack/react-table";
import { Users } from "lucide-react";

import { clusteringMessages } from "@/features/clustering/messages";
import type { ClusteringOutput } from "@/features/clustering/types";
import { CLUSTER_LEVELS } from "@/lib/badminton/categories";
import { dataTableFeatures } from "@/lib/data-table-features";
import { useMessages } from "@/lib/i18n/locale-provider";

import { DataTable } from "../../../_components/data-table/data-table";
import { DataTableFacetedFilter } from "../../../_components/data-table/data-table-faceted-filter";
import { DataTableToolbar } from "../../../_components/data-table/data-table-toolbar";
import { memberName, useClusterFormat } from "./cluster-format";
import { createMemberColumns } from "./members-columns";

/** Semua unit yang di-cluster (tabel client-side): cluster, statistik, fitur, jarak ke centroid, silhouette. */
export function MembersTable({ result }: { readonly result: ClusteringOutput }) {
  const m = useMessages(clusteringMessages);
  const format = useClusterFormat();
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [columnVisibility, setColumnVisibility] = useState({});

  const query = search.trim().toLowerCase();
  const data = query
    ? result.members.filter((member) => memberName(member).toLowerCase().includes(query))
    : result.members;
  const columns = createMemberColumns({
    m,
    format,
    context: { clusters: result.clusters, normalization: result.normalization },
  });

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    state: { columnFilters, pagination, columnVisibility },
    getRowId: (row) => row.entryId,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
  });

  const labels = m.members.columns;

  return (
    <DataTable
      table={table}
      loading={false}
      empty={{ icon: Users, title: m.members.empty }}
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPagination((current) => ({ ...current, pageIndex: 0 }));
      }}
      toolbar={
        <DataTableToolbar
          table={table}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPagination((current) => ({ ...current, pageIndex: 0 }));
          }}
          searchPlaceholder={m.members.searchPlaceholder}
          columnLabels={{
            level: labels.level,
            record: labels.record,
            winRate: labels.winRate,
            gameWinRate: labels.gameWinRate,
            pointDiff: labels.pointDiff,
            distance: labels.distance,
            silhouette: labels.silhouette,
          }}
        >
          <DataTableFacetedFilter
            table={table}
            columnId="level"
            title={m.members.level}
            options={CLUSTER_LEVELS.map((level) => ({ value: level, label: m.levels[level].name }))}
          />
        </DataTableToolbar>
      }
    />
  );
}
