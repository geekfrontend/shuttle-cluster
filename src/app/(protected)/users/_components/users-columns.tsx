"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UsersMessages } from "@/features/users/messages";
import type { User } from "@/features/users/types";
import type { WorkspaceMessages } from "@/features/workspace/messages";
import type { useFormatters } from "@/hooks/use-formatters";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { getInitials } from "@/lib/utils";

import { UserRoleBadge, UserStatusBadge } from "./user-badges";
import { UserRowActions } from "./user-row-actions";

type ColumnContext = {
  m: UsersMessages;
  w: WorkspaceMessages;
  format: ReturnType<typeof useFormatters>;
  meId: string;
};

export function createUserColumns({ m, w, format, meId }: ColumnContext): ColumnDef<DataTableFeatures, User>[] {
  const columns = m.list.columns;

  return [
    {
      id: "user",
      accessorFn: (row) => row.name,
      header: columns.user,
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
              <AvatarFallback className="text-[0.625rem]">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 leading-tight">
              <span className="truncate font-medium text-sm">
                {user.name}
                {user.id === meId && <span className="ml-1.5 font-normal text-muted-foreground">({w.common.you})</span>}
              </span>
              <span className="truncate text-muted-foreground text-xs">{user.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "role",
      accessorFn: (row) => row.role,
      header: columns.role,
      cell: ({ row }) => <UserRoleBadge role={row.original.role} />,
    },
    {
      id: "status",
      accessorFn: (row) => row.status,
      header: columns.status,
      cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
    },
    {
      id: "lastActive",
      accessorFn: (row) => row.lastActiveAt ?? "",
      header: columns.lastActive,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">
          {row.original.lastActiveAt ? format.dateTime(row.original.lastActiveAt) : w.common.never}
        </span>
      ),
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
      cell: ({ row }) => <UserRowActions user={row.original} isSelf={row.original.id === meId} />,
    },
  ];
}
