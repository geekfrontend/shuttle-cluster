"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { Workspace } from "@/server/workspace/workspace";

const WorkspaceContext = createContext<Workspace | null>(null);

/** Disediakan layout `(protected)` dari `getWorkspace()` di server. */
export function WorkspaceProvider({
  workspace,
  children,
}: {
  readonly workspace: Workspace;
  readonly children: ReactNode;
}) {
  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): Workspace {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return workspace;
}

/** Hanya untuk menampilkan/menyembunyikan UI. Otorisasi sesungguhnya tetap di API. */
export function useIsAdmin(): boolean {
  return useWorkspace().user.role === "admin";
}
