import { KeyRound } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { accountMessages } from "@/features/account/messages";
import { workspaceMessages } from "@/features/workspace/messages";
import { getLocale, getMessages } from "@/server/i18n";

export async function SecurityCard({
  createdAt,
  lastActiveAt,
}: {
  readonly createdAt: Date;
  readonly lastActiveAt: Date | null;
}) {
  const [m, w, locale] = await Promise.all([getMessages(accountMessages), getMessages(workspaceMessages), getLocale()]);
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{m.security.title}</CardTitle>
        <CardDescription>{m.security.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-xs">
        <div className="flex gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center bg-muted text-muted-foreground">
            <KeyRound className="size-4" />
          </span>
          <div className="grid gap-0.5">
            <span className="font-medium">{m.security.password}</span>
            <span className="text-muted-foreground">{m.security.passwordDisabled}</span>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div className="grid gap-0.5">
            <dt className="text-muted-foreground">{m.security.created}</dt>
            <dd className="tabular-nums">{format.format(createdAt)}</dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="text-muted-foreground">{m.security.lastActive}</dt>
            <dd className="tabular-nums">{lastActiveAt ? format.format(lastActiveAt) : w.common.never}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
