import type { SkeletonColumn } from "@/components/shared/skeletons";

/** Bentuk kolom skeleton per tabel, urut sama dengan definisi kolomnya. */
export const SKELETON_COLUMNS = {
  users: [
    { id: "user", shape: "stacked" },
    { id: "role", shape: "badge" },
    { id: "status", shape: "badge" },
    { id: "created", shape: "short" },
    { id: "actions", shape: "actions" },
  ],
} satisfies Record<string, SkeletonColumn[]>;
