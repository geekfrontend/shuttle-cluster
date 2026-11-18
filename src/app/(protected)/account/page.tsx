import { redirect } from "next/navigation";

import { KeyRound, Languages, UserRound } from "lucide-react";
import type { Metadata } from "next";

import { accountMessages } from "@/features/account/messages";
import { toLocale } from "@/lib/i18n/config";
import { getMessages } from "@/server/i18n";
import { getMe } from "@/server/services/me.service";
import { getWorkspace } from "@/server/workspace/workspace";

import { PageTabs } from "../_components/page-tabs";
import { PreferencesForm } from "./_components/preferences-form";
import { ProfileForm } from "./_components/profile-form";
import { SecurityCard } from "./_components/security-card";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages(accountMessages);
  return { title: m.page.metaTitle, alternates: { canonical: "/account" } };
}

/** Pengaturan pribadi user yang sedang login. */
export default async function Page({ searchParams }: { readonly searchParams: Promise<{ tab?: string }> }) {
  const workspace = await getWorkspace();
  if (!workspace) redirect("/login");

  const [me, m] = await Promise.all([getMe(workspace.user.id), getMessages(accountMessages)]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl tracking-tight">{m.page.title}</h2>
        <p className="text-muted-foreground">{m.page.description}</p>
      </div>

      <PageTabs
        initialTab={(await searchParams).tab}
        tabs={[
          {
            value: "profile",
            label: m.tabs.profile,
            icon: <UserRound />,
            content: (
              <div className="max-w-3xl">
                <ProfileForm key={me.name} name={me.name} email={me.email} avatar={me.avatarUrl ?? ""} />
              </div>
            ),
          },
          {
            value: "preferences",
            label: m.tabs.preferences,
            icon: <Languages />,
            content: (
              <div className="max-w-xl">
                <PreferencesForm savedLocale={toLocale(me.locale)} />
              </div>
            ),
          },
          {
            value: "security",
            label: m.tabs.security,
            icon: <KeyRound />,
            content: (
              <div className="max-w-xl">
                <SecurityCard createdAt={me.createdAt} lastActiveAt={me.lastActiveAt} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
