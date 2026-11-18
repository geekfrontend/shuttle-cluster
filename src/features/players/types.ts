import type { Gender } from "@/lib/badminton/match-rules";
import type { Page } from "@/lib/pagination";

export type { Gender } from "@/lib/badminton/match-rules";

export type Player = {
  id: string;
  name: string;
  gender: Gender;
  country: string | null;
  externalId: string | null;
  matchCount: number;
  createdAt: string;
};

export type ListPlayersRequest = { page: number; pageSize: number; q?: string; gender?: Gender[] };
export type ListPlayersResponse = Page<Player>;

export type CreatePlayerRequest = {
  name: string;
  gender: Gender;
  country?: string | null;
  externalId?: string | null;
};
export type UpdatePlayerRequest = Partial<CreatePlayerRequest>;

/** Hasil mutasi: data + pesan sukses dari server (sudah diterjemahkan). */
export type MutationResult<T> = { data: T; message: string };
