"use client";

import { useState } from "react";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { clusteringMessages } from "@/features/clustering/messages";
import { useDeleteMatch } from "@/features/matches/hooks/use-match-mutations";
import { matchesMessages } from "@/features/matches/messages";
import type { Match } from "@/features/matches/types";
import { workspaceMessages } from "@/features/workspace/messages";
import { useFormatters } from "@/hooks/use-formatters";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

import { DataTableDetailDialog, DataTableRowActions } from "../../_components/data-table/data-table-row-actions";
import { MatchScore, MatchSideCell, MatchStatusBadge, sideName } from "./match-parts";

export function MatchRowActions({ match, isAdmin }: { readonly match: Match; readonly isAdmin: boolean }) {
  const m = useMessages(matchesMessages);
  const c = useMessages(clusteringMessages);
  const w = useMessages(workspaceMessages);
  const format = useFormatters();
  const remove = useDeleteMatch();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const columns = m.list.columns;
  const title = `${sideName(match.sideA.players)} vs ${sideName(match.sideB.players)}`;

  return (
    <>
      <DataTableRowActions
        name={title}
        view={
          <DataTableDetailDialog
            name={title}
            title={match.tournament}
            description={[match.round, format.date(match.playedOn)].filter(Boolean).join(" · ")}
            items={[
              { label: columns.category, value: `${match.category} · ${c.categories[match.category].name}` },
              { label: columns.status, value: <MatchStatusBadge retired={match.retired} /> },
              {
                label: columns.sideA,
                value: <MatchSideCell players={match.sideA.players} won={match.winner === "a"} />,
              },
              {
                label: columns.sideB,
                value: <MatchSideCell players={match.sideB.players} won={match.winner === "b"} />,
              },
              { label: columns.score, value: <MatchScore match={match} />, wide: true },
            ]}
          />
        }
      >
        {isAdmin ? (
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
            <Trash2 />
            {m.rowActions.delete}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>

      {isAdmin && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          icon={Trash2}
          title={m.delete.title}
          description={interpolate(m.delete.description, {
            a: sideName(match.sideA.players),
            b: sideName(match.sideB.players),
            tournament: match.tournament,
          })}
          confirmLabel={m.delete.confirm}
          cancelLabel={w.common.cancel}
          pending={remove.isPending}
          onConfirm={() =>
            remove.mutate(match.id, {
              onSuccess: ({ message }) => {
                toast.success(message);
                setConfirmDelete(false);
              },
              onError: (error) => toast.error(error.message),
            })
          }
        />
      )}
    </>
  );
}
