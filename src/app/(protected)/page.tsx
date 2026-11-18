import { redirect } from "next/navigation";

import { Contact, Swords, Trophy, UserRound, Users } from "lucide-react";
import type { Metadata } from "next";

import { dashboardMessages } from "@/features/dashboard/messages";
import { interpolate } from "@/lib/i18n/ui";
import { getMessages } from "@/server/i18n";
import { getWorkspace } from "@/server/workspace/workspace";

import { type QuickLink, QuickLinks } from "./_components/dashboard/quick-links";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages(dashboardMessages);
  return { title: m.metaTitle, alternates: { canonical: "/" } };
}

export default async function Page() {
  const workspace = await getWorkspace();
  if (!workspace) redirect("/login");

  const m = await getMessages(dashboardMessages);
  const firstName = workspace.user.name.split(" ")[0] ?? workspace.user.name;
  const links: QuickLink[] = [
    { href: "/players", icon: Contact, ...m.links.players },
    { href: "/matches", icon: Swords, ...m.links.matches },
    { href: "/categories", icon: Trophy, ...m.links.categories },
    ...(workspace.user.role === "admin" ? [{ href: "/users", icon: Users, ...m.links.users }] : []),
    { href: "/account", icon: UserRound, ...m.links.account },
  ];

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div>
        <h2 className="text-3xl tracking-tight">{interpolate(m.greeting, { name: firstName })}</h2>
        <p className="text-muted-foreground">{m.description}</p>
      </div>
      <div className="max-w-md">
        <QuickLinks title={m.quickLinks} links={links} />
      </div>
    </div>
  );
}
