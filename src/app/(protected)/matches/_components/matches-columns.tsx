"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { ClusteringMessages } from "@/features/clustering/messages";
import type { MatchesMessages } from "@/features/matches/messages";
import type { Match } from "@/features/matches/types";
import type { WorkspaceMessages } from "@/features/workspace/messages";
import type { useFormatters } from "@/hooks/use-formatters";
import type { DataTableFeatures } from "@/lib/data-table-features";

import { MatchScore, MatchSideCell, MatchStatusBadge } from "./match-parts";
import { MatchRowActions } from "./match-row-actions";

type ColumnContext = {
  m: MatchesMessages;
  c: ClusteringMessages;
  w: WorkspaceMessages;
  format: ReturnType<typeof useFormatters>;
  isAdmin: boolean;
};

export function createMatchColumns({ m, c, w, format, isAdmin }: ColumnContext): ColumnDef<DataTableFeatures, Match>[] {
  const columns = m.list.columns;

  return [
    {
      id: "playedOn",
      accessorFn: (row) => row.playedOn,
      header: columns.playedOn,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm tabular-nums">{format.date(row.original.playedOn)}</span>
      ),
    },
    {
      id: "category",
      accessorFn: (row) => row.category,
      header: columns.category,
      cell: ({ row }) => (
        <div className="grid leading-tight">
          <span className="font-medium font-mono text-sm">{row.original.category}</span>
          <span className="truncate text-muted-foreground text-xs">{c.categories[row.original.category].name}</span>
        </div>
      ),
    },
    {
      id: "tournament",
      accessorFn: (row) => row.tournament,
      header: columns.tournament,
      cell: ({ row }) => (
        <div className="grid max-w-56 leading-tight">
          <span className="truncate font-medium text-sm">{row.original.tournament}</span>
          {row.original.round && <span className="truncate text-muted-foreground text-xs">{row.original.round}</span>}
        </div>
      ),
    },
    {
      id: "sideA",
      header: columns.sideA,
      cell: ({ row }) => <MatchSideCell players={row.original.sideA.players} won={row.original.winner === "a"} />,
    },
    {
      id: "sideB",
      header: columns.sideB,
      cell: ({ row }) => <MatchSideCell players={row.original.sideB.players} won={row.original.winner === "b"} />,
    },
    {
      id: "score",
      header: columns.score,
      cell: ({ row }) => <MatchScore match={row.original} />,
    },
    {
      id: "status",
      accessorFn: (row) => (row.retired ? "retired" : "finished"),
      header: columns.status,
      cell: ({ row }) => <MatchStatusBadge retired={row.original.retired} />,
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{w.common.actions}</span>,
      cell: ({ row }) => <MatchRowActions match={row.original} isAdmin={isAdmin} />,
    },
  ];
}
