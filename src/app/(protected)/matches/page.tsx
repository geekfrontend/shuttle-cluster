import type { Metadata } from "next";

import { matchesMessages } from "@/features/matches/messages";
import { getMessages } from "@/server/i18n";

import { MatchesScreen } from "./_components/matches-screen";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages(matchesMessages);
  return { title: m.list.metaTitle, alternates: { canonical: "/matches" } };
}

export default function Page() {
  return <MatchesScreen />;
}
