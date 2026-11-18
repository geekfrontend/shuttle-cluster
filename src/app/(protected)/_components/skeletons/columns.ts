import type { SkeletonColumn } from "@/components/shared/skeletons";

/** Bentuk kolom skeleton per tabel, urut sama dengan definisi kolomnya. */
export const SKELETON_COLUMNS = {
  players: [
    { id: "player", shape: "identity" },
    { id: "gender", shape: "badge" },
    { id: "country", shape: "short" },
    { id: "matches", shape: "number" },
    { id: "actions", shape: "actions" },
  ],
  matches: [
    { id: "playedOn", shape: "short" },
    { id: "category", shape: "stacked" },
    { id: "tournament", shape: "stacked" },
    { id: "sideA", shape: "text" },
    { id: "sideB", shape: "text" },
    { id: "score", shape: "text" },
    { id: "status", shape: "badge" },
    { id: "actions", shape: "actions" },
  ],
  categories: [
    { id: "code", shape: "short" },
    { id: "category", shape: "stacked" },
    { id: "unit", shape: "text" },
    { id: "matches", shape: "number" },
    { id: "units", shape: "number" },
    { id: "dataRange", shape: "text" },
    { id: "actions", shape: "actions" },
  ],
  users: [
    { id: "user", shape: "stacked" },
    { id: "role", shape: "badge" },
    { id: "status", shape: "badge" },
    { id: "created", shape: "short" },
    { id: "actions", shape: "actions" },
  ],
} satisfies Record<string, SkeletonColumn[]>;
