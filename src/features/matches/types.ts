import type { CategoryCode } from "@/lib/badminton/categories";
import type { GameScore, MatchSide } from "@/lib/badminton/match-rules";
import type { Page } from "@/lib/pagination";

export type { GameScore, MatchSide } from "@/lib/badminton/match-rules";

export type MatchPlayer = { id: string; name: string; country: string | null };

export type Match = {
  id: string;
  category: CategoryCode;
  tournament: string;
  round: string | null;
  /** `YYYY-MM-DD`. */
  playedOn: string;
  winner: MatchSide;
  retired: boolean;
  sideA: { entryId: string; players: MatchPlayer[] };
  sideB: { entryId: string; players: MatchPlayer[] };
  games: (GameScore & { number: number })[];
  createdAt: string;
};

export type ListMatchesRequest = { page: number; pageSize: number; q?: string; category?: CategoryCode[] };
export type ListMatchesResponse = Page<Match>;

export type CreateMatchRequest = {
  category: CategoryCode;
  tournament: string;
  round?: string | null;
  playedOn: string;
  sideA: string[];
  sideB: string[];
  games: GameScore[];
  retired: boolean;
  winner?: MatchSide;
};

/** Hasil mutasi: data + pesan sukses dari server (sudah diterjemahkan). */
export type MutationResult<T> = { data: T; message: string };
