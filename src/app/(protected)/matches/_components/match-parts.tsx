"use client";

import { cn } from "cn";
import { Trophy } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { matchesMessages } from "@/features/matches/messages";
import type { Match, MatchPlayer } from "@/features/matches/types";
import { useMessages } from "@/lib/i18n/locale-provider";

export const sideName = (players: MatchPlayer[]) => players.map((player) => player.name).join(" / ");

/** Satu sisi: nama pemain (dan negara); pemenang ditebalkan dengan ikon piala. */
export function MatchSideCell({ players, won }: { readonly players: MatchPlayer[]; readonly won: boolean }) {
  const m = useMessages(matchesMessages).list;
  return (
    <div className={cn("grid min-w-0 gap-0.5 leading-tight", won ? "font-medium" : "text-muted-foreground")}>
      {players.map((player) => (
        <span key={player.id} className="flex items-center gap-1.5 truncate text-sm">
          <span className="truncate">{player.name}</span>
          {player.country && <span className="font-mono text-[0.625rem] text-muted-foreground">{player.country}</span>}
        </span>
      ))}
      {won && (
        <span className="inline-flex items-center gap-1 text-[0.625rem] text-emerald-600 dark:text-emerald-400">
          <Trophy className="size-3" aria-hidden="true" />
          {m.winner}
        </span>
      )}
    </div>
  );
}

/** Skor per game, sisi A di depan; game yang dimenangi sisi A ditebalkan. */
export function MatchScore({ match }: { readonly match: Match }) {
  const m = useMessages(matchesMessages).list;
  if (match.games.length === 0) return <span className="text-muted-foreground text-sm">{m.walkover}</span>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {match.games.map((game) => (
        <span
          key={game.number}
          className="border px-1.5 py-0.5 font-mono text-xs tabular-nums"
          title={`${game.scoreA}-${game.scoreB}`}
        >
          <span className={game.scoreA > game.scoreB ? "font-semibold" : undefined}>{game.scoreA}</span>
          <span className="text-muted-foreground">–</span>
          <span className={game.scoreB > game.scoreA ? "font-semibold" : undefined}>{game.scoreB}</span>
        </span>
      ))}
    </span>
  );
}

export function MatchStatusBadge({ retired }: { readonly retired: boolean }) {
  const m = useMessages(matchesMessages).list;
  return <Badge tone={retired ? "warning" : "success"}>{retired ? m.retired : m.finished}</Badge>;
}
