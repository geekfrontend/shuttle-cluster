"use client";

import { useState } from "react";

import { KeyRound, ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useUpdateUser } from "@/features/users/hooks/use-user-mutations";
import { usersMessages } from "@/features/users/messages";
import type { UpdateUserRequest, User } from "@/features/users/types";
import { workspaceMessages } from "@/features/workspace/messages";
import { useFormatters } from "@/hooks/use-formatters";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

import { DataTableDetailDialog, DataTableRowActions } from "../../_components/data-table/data-table-row-actions";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { UserRoleBadge, UserStatusBadge } from "./user-badges";

export function UserRowActions({
  user,
  isSelf,
}: {
  readonly user: User;
  /** Baris milik user yang login: hanya lihat detail, tanpa aksi kelola. */
  readonly isSelf: boolean;
}) {
  const m = useMessages(usersMessages);
  const w = useMessages(workspaceMessages);
  const format = useFormatters();
  const update = useUpdateUser();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const isAdmin = user.role === "admin";
  const isDeactivated = user.status === "deactivated";
  const columns = m.list.columns;

  function apply(request: UpdateUserRequest, onDone?: () => void) {
    update.mutate(
      { userId: user.id, ...request },
      {
        onSuccess: ({ message }) => {
          toast.success(message);
          onDone?.();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <>
      <DataTableRowActions
        name={user.name}
        view={
          <DataTableDetailDialog
            name={user.name}
            title={user.name}
            description={user.email}
            items={[
              { label: columns.role, value: <UserRoleBadge role={user.role} /> },
              { label: columns.status, value: <UserStatusBadge status={user.status} /> },
              {
                label: columns.lastActive,
                value: user.lastActiveAt ? format.dateTime(user.lastActiveAt) : w.common.never,
              },
              { label: columns.created, value: format.date(user.createdAt) },
            ]}
          />
        }
      >
        {isSelf || update.isPending ? null : (
          <>
            <DropdownMenuItem onSelect={() => apply({ role: isAdmin ? "user" : "admin" })}>
              {isAdmin ? <ShieldOff /> : <ShieldCheck />}
              {isAdmin ? m.rowActions.makeUser : m.rowActions.makeAdmin}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setResetOpen(true)}>
              <KeyRound />
              {m.rowActions.resetPassword}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isDeactivated || user.status === "locked" ? (
              <DropdownMenuItem onSelect={() => apply({ status: "active" })}>
                <UserCheck />
                {m.rowActions.activate}
              </DropdownMenuItem>
            ) : null}
            {isDeactivated ? null : (
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDeactivate(true)}>
                <UserX />
                {m.rowActions.deactivate}
              </DropdownMenuItem>
            )}
          </>
        )}
      </DataTableRowActions>

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        icon={UserX}
        title={interpolate(m.deactivate.title, { name: user.name })}
        description={interpolate(m.deactivate.description, { name: user.name })}
        confirmLabel={m.deactivate.confirm}
        cancelLabel={w.common.cancel}
        pending={update.isPending}
        onConfirm={() => apply({ status: "deactivated" }, () => setConfirmDeactivate(false))}
      />

      <ResetPasswordDialog user={user} open={resetOpen} onOpenChange={setResetOpen} />
    </>
  );
}
