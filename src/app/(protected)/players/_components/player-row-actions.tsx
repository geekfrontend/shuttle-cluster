"use client";

import { useState } from "react";

import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useDeletePlayer } from "@/features/players/hooks/use-player-mutations";
import { playersMessages } from "@/features/players/messages";
import type { Player } from "@/features/players/types";
import { workspaceMessages } from "@/features/workspace/messages";
import { useFormatters } from "@/hooks/use-formatters";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

import { DataTableDetailDialog, DataTableRowActions } from "../../_components/data-table/data-table-row-actions";
import { GenderBadge } from "./gender-badge";
import { PlayerFormDialog } from "./player-form-dialog";

export function PlayerRowActions({ player, isAdmin }: { readonly player: Player; readonly isAdmin: boolean }) {
  const m = useMessages(playersMessages);
  const w = useMessages(workspaceMessages);
  const format = useFormatters();
  const remove = useDeletePlayer();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const columns = m.list.columns;

  return (
    <>
      <DataTableRowActions
        name={player.name}
        view={
          <DataTableDetailDialog
            name={player.name}
            title={player.name}
            items={[
              { label: columns.gender, value: <GenderBadge gender={player.gender} /> },
              { label: columns.country, value: player.country ?? w.common.none, mono: player.country !== null },
              { label: columns.matches, value: format.number(player.matchCount) },
              {
                label: columns.externalId,
                value: player.externalId ?? w.common.none,
                mono: player.externalId !== null,
              },
              { label: columns.created, value: format.date(player.createdAt) },
            ]}
          />
        }
      >
        {isAdmin ? (
          <>
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil />
              {m.rowActions.edit}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
              <Trash2 />
              {m.rowActions.delete}
            </DropdownMenuItem>
          </>
        ) : null}
      </DataTableRowActions>

      {isAdmin && (
        <>
          {/* `key` dari isi yang bisa diubah: form dibuat ulang dengan nilai terbaru setelah data dimuat ulang. */}
          <PlayerFormDialog
            key={[player.id, player.name, player.gender, player.country, player.externalId].join("|")}
            player={player}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <ConfirmDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            icon={Trash2}
            title={interpolate(m.delete.title, { name: player.name })}
            description={m.delete.description}
            confirmLabel={m.delete.confirm}
            cancelLabel={w.common.cancel}
            pending={remove.isPending}
            onConfirm={() =>
              remove.mutate(player.id, {
                onSuccess: ({ message }) => {
                  toast.success(message);
                  setConfirmDelete(false);
                },
                onError: (error) => {
                  toast.error(error.message);
                  setConfirmDelete(false);
                },
              })
            }
          />
        </>
      )}
    </>
  );
}
