import type { ReactNode } from "react";

import { workspaceMessages } from "@/features/workspace/messages";
import { getMessages } from "@/server/i18n";

import { PageSkeleton } from "./page-skeletons";

/** Pembungkus `loading.tsx`: skeleton halaman plus label "Memuat…" untuk pembaca layar. */
export async function RouteLoading({ children }: { readonly children: ReactNode }) {
  const m = await getMessages(workspaceMessages);
  return <PageSkeleton label={m.common.loading}>{children}</PageSkeleton>;
}
