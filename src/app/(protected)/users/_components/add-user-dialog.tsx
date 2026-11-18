"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useCreateUser } from "@/features/users/hooks/use-user-mutations";
import { type UsersMessages, usersMessages } from "@/features/users/messages";
import { workspaceMessages } from "@/features/workspace/messages";
import { ApiClientError } from "@/lib/api-client";
import { useMessages } from "@/lib/i18n/locale-provider";

function createSchema(m: UsersMessages["create"], passwordHint: string) {
  return z.object({
    email: z.email({ message: m.emailInvalid }),
    name: z.string().trim().min(1, { message: m.nameRequired }).max(120),
    password: z.string().min(12, { message: passwordHint }).max(128),
    role: z.enum(["admin", "user"]),
  });
}

type FormValues = z.infer<ReturnType<typeof createSchema>>;

const DEFAULTS: FormValues = { email: "", name: "", password: "", role: "user" };
const FIELDS = ["email", "name", "password", "role"] as const;

export function AddUserDialog() {
  const m = useMessages(usersMessages);
  const w = useMessages(workspaceMessages);
  const [open, setOpen] = useState(false);
  const schema = createSchema(m.create, w.common.passwordHint);
  const create = useCreateUser();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });

  function onOpenChange(next: boolean) {
    if (!next && create.isPending) return;
    setOpen(next);
    if (!next) {
      form.reset(DEFAULTS);
      create.reset();
    }
  }

  function onSubmit(values: FormValues) {
    create.mutate(values, {
      onSuccess: ({ message }) => {
        toast.success(message);
        onOpenChange(false);
      },
      onError: (error) => {
        if (!(error instanceof ApiClientError)) return;
        for (const field of FIELDS) {
          const messages = error.fieldErrors[field];
          if (messages?.length) form.setError(field, { message: messages[0] });
        }
      },
    });
  }

  const fieldError = create.error instanceof ApiClientError ? create.error : null;
  const showErrorAlert = create.isError && !FIELDS.some((field) => fieldError?.fieldErrors[field]?.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          {m.list.add}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{m.create.title}</DialogTitle>
            <DialogDescription>{m.create.description}</DialogDescription>
          </DialogHeader>

          {showErrorAlert && (
            <Alert variant="soft-destructive">
              <CircleAlert aria-hidden="true" />
              <AlertDescription>{create.error?.message}</AlertDescription>
            </Alert>
          )}

          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="add-user-name">{m.create.name}</FieldLabel>
                    <Input {...field} id="add-user-name" autoComplete="off" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="add-user-email">{m.create.email}</FieldLabel>
                    <Input
                      {...field}
                      id="add-user-email"
                      type="email"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="add-user-password">{m.create.password}</FieldLabel>
                  <PasswordInput
                    showLabel={w.common.showPassword}
                    hideLabel={w.common.hidePassword}
                    {...field}
                    id="add-user-password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>{w.common.passwordHint}</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="add-user-role">{m.create.role}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="add-user-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{w.roles.user}</SelectItem>
                      <SelectItem value="admin">{w.roles.admin}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>{m.create.roleHint}</FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={create.isPending}>
                {w.common.cancel}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Spinner data-icon="inline-start" />}
              {m.create.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
