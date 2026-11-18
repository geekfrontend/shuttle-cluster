import { ShieldX } from "lucide-react";

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { workspaceMessages } from "@/features/workspace/messages";
import { getMessages } from "@/server/i18n";

/** Server Component: halaman yang tidak boleh dibuka user ini (mis. halaman khusus admin). */
export async function AccessEmptyState() {
  const m = await getMessages(workspaceMessages);

  return (
    <Empty className="min-h-96 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldX />
        </EmptyMedia>
        <EmptyTitle>{m.forbidden.title}</EmptyTitle>
        <EmptyDescription>{m.forbidden.description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
