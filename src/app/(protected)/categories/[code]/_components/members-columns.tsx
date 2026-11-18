"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { ClusteringMessages } from "@/features/clustering/messages";
import type { ClusterMember } from "@/features/clustering/types";
import { CLUSTER_LEVELS } from "@/lib/badminton/categories";
import type { DataTableFeatures } from "@/lib/data-table-features";

import { type ClusterFormat, memberName } from "./cluster-format";
import { ClusterLevelBadge } from "./cluster-level-badge";
import { type CalculationContext, UnitCalculationDialog } from "./unit-calculation-dialog";

const numeric = "text-right tabular-nums";

export function createMemberColumns({
  m,
  format,
  context,
}: {
  m: ClusteringMessages;
  format: ClusterFormat;
  /** Data bersama untuk dialog perhitungan (normalisasi & centroid). */
  context: CalculationContext;
}): ColumnDef<DataTableFeatures, ClusterMember>[] {
  const columns = m.members.columns;

  return [
    {
      id: "unit",
      accessorFn: memberName,
      header: columns.unit,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="grid min-w-0 gap-0.5 leading-tight">
          {row.original.players.map((player) => (
            <span key={player.id} className="flex items-center gap-1.5 truncate text-sm">
              <span className="truncate font-medium">{player.name}</span>
              {player.country && (
                <span className="font-mono text-[0.625rem] text-muted-foreground">{player.country}</span>
              )}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "level",
      accessorFn: (row) => row.level,
      header: columns.level,
      cell: ({ row }) => <ClusterLevelBadge level={row.original.level} />,
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      id: "record",
      accessorFn: (row) => row.stats.wins,
      header: () => <span className="block text-right">{columns.record}</span>,
      cell: ({ row }) => (
        <span className={`block text-sm ${numeric}`}>
          {format.integer(row.original.stats.wins)}–
          {format.integer(row.original.stats.matches - row.original.stats.wins)}
        </span>
      ),
    },
    {
      id: "winRate",
      accessorFn: (row) => row.features.winRate,
      header: () => <span className="block text-right">{columns.winRate}</span>,
      cell: ({ row }) => (
        <span className={`block text-sm ${numeric}`}>{format.percent(row.original.features.winRate)}</span>
      ),
    },
    {
      id: "gameWinRate",
      accessorFn: (row) => row.features.gameWinRate,
      header: () => <span className="block text-right">{columns.gameWinRate}</span>,
      cell: ({ row }) => (
        <span className={`block text-sm ${numeric}`}>{format.percent(row.original.features.gameWinRate)}</span>
      ),
    },
    {
      id: "pointDiff",
      accessorFn: (row) => row.features.pointDiffPerGame,
      header: () => <span className="block text-right">{columns.pointDiff}</span>,
      cell: ({ row }) => (
        <span className={`block text-sm ${numeric}`}>{format.signed(row.original.features.pointDiffPerGame)}</span>
      ),
    },
    {
      id: "distance",
      accessorFn: (row) => row.distances[CLUSTER_LEVELS.indexOf(row.level)] ?? 0,
      header: () => <span className="block text-right">{columns.distance}</span>,
      cell: ({ row }) => (
        <span className={`block text-muted-foreground text-xs ${numeric}`}>
          {format.decimal(row.original.distances[CLUSTER_LEVELS.indexOf(row.original.level)] ?? 0)}
        </span>
      ),
    },
    {
      id: "silhouette",
      accessorFn: (row) => row.silhouette,
      header: () => <span className="block text-right">{columns.silhouette}</span>,
      cell: ({ row }) => (
        <span
          className={`block text-xs ${numeric} ${row.original.silhouette < 0 ? "text-destructive" : "text-muted-foreground"}`}
        >
          {format.decimal(row.original.silhouette)}
        </span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{m.members.viewCalculation}</span>,
      cell: ({ row }) => <UnitCalculationDialog member={row.original} context={context} />,
    },
  ];
}
