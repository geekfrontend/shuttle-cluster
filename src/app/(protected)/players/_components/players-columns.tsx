"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PlayersMessages } from "@/features/players/messages";
import type { Player } from "@/features/players/types";
import type { WorkspaceMessages } from "@/features/workspace/messages";
import type { useFormatters } from "@/hooks/use-formatters";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { getInitials } from "@/lib/utils";

import { GenderBadge } from "./gender-badge";
import { PlayerRowActions } from "./player-row-actions";

type ColumnContext = {
  m: PlayersMessages;
  w: WorkspaceMessages;
  format: ReturnType<typeof useFormatters>;
  isAdmin: boolean;
};

export function createPlayerColumns({ m, w, format, isAdmin }: ColumnContext): ColumnDef<DataTableFeatures, Player>[] {
  const columns = m.list.columns;

  return [
    {
      id: "player",
      accessorFn: (row) => row.name,
      header: columns.player,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback className="text-[0.625rem]">{getInitials(row.original.name)}</AvatarFallback>
          </Avatar>
          <span className="truncate font-medium text-sm">{row.original.name}</span>
        </div>
      ),
    },
    {
      id: "gender",
      accessorFn: (row) => row.gender,
      header: columns.gender,
      cell: ({ row }) => <GenderBadge gender={row.original.gender} />,
    },
    {
      id: "country",
      accessorFn: (row) => row.country ?? "",
      header: columns.country,
      cell: ({ row }) =>
        row.original.country ? (
          <span className="font-mono text-sm">{row.original.country}</span>
        ) : (
          <span className="text-muted-foreground text-sm">{w.common.none}</span>
        ),
    },
    {
      id: "matches",
      accessorFn: (row) => row.matchCount,
      header: columns.matches,
      cell: ({ row }) => <span className="text-sm tabular-nums">{format.number(row.original.matchCount)}</span>,
    },
    {
      id: "externalId",
      accessorFn: (row) => row.externalId ?? "",
      header: columns.externalId,
      cell: ({ row }) => <span className="font-mono text-muted-foreground text-xs">{row.original.externalId}</span>,
    },
    {
      id: "created",
      accessorFn: (row) => row.createdAt,
      header: columns.created,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">{format.date(row.original.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{w.common.actions}</span>,
      cell: ({ row }) => <PlayerRowActions player={row.original} isAdmin={isAdmin} />,
    },
  ];
}
