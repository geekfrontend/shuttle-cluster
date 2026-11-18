import { redirect } from "next/navigation";

import type { Metadata } from "next";

import { usersMessages } from "@/features/users/messages";
import { getMessages } from "@/server/i18n";
import { getWorkspace } from "@/server/workspace/workspace";

import { AccessEmptyState } from "../_components/workspace/access-empty-state";
import { UsersScreen } from "./_components/users-screen";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages(usersMessages);
  return { title: m.list.metaTitle, alternates: { canonical: "/users" } };
}

export default async function Page() {
  const workspace = await getWorkspace();
  if (!workspace) redirect("/login");
  if (workspace.user.role !== "admin") return <AccessEmptyState />;

  return <UsersScreen />;
}
