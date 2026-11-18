"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateProfile } from "@/features/account/hooks/use-update-profile";
import { accountMessages } from "@/features/account/messages";
import { useMessages } from "@/lib/i18n/locale-provider";
import { getInitials } from "@/lib/utils";

export function ProfileForm({
  name: initialName,
  email,
  avatar,
}: {
  readonly name: string;
  readonly email: string;
  readonly avatar: string;
}) {
  const m = useMessages(accountMessages).profile;
  const router = useRouter();
  const update = useUpdateProfile();
  const [name, setName] = useState(initialName);

  const trimmed = name.trim();
  const changed = trimmed.length > 0 && trimmed !== initialName;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{m.title}</CardTitle>
        <CardDescription>{m.description}</CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!changed) return;
          update.mutate(
            { name: trimmed },
            {
              onSuccess: ({ message }) => {
                toast.success(message);
                router.refresh();
              },
              onError: (error) => toast.error(error.message),
            },
          );
        }}
      >
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={avatar || undefined} alt="" />
              <AvatarFallback className="bg-primary/15 font-semibold text-primary">
                {getInitials(trimmed || initialName)}
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 leading-tight">
              <span className="truncate font-medium">{trimmed || initialName}</span>
              <span className="truncate text-muted-foreground text-xs">{email}</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="account-name">{m.name}</FieldLabel>
              <Input
                id="account-name"
                value={name}
                maxLength={120}
                autoComplete="name"
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-email">{m.email}</FieldLabel>
              <Input id="account-email" value={email} readOnly disabled />
              <FieldDescription>{m.emailHint}</FieldDescription>
            </Field>
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" size="sm" disabled={!changed || update.isPending}>
            {update.isPending && <Spinner data-icon="inline-start" />}
            {m.save}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
