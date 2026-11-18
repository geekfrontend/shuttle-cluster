import type { Metadata } from "next";

import { playersMessages } from "@/features/players/messages";
import { getMessages } from "@/server/i18n";

import { PlayersScreen } from "./_components/players-screen";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages(playersMessages);
  return { title: m.list.metaTitle, alternates: { canonical: "/players" } };
}

export default function Page() {
  return <PlayersScreen />;
}
