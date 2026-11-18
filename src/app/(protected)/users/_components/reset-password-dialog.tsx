"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { useResetUserPassword } from "@/features/users/hooks/use-user-mutations";
import { usersMessages } from "@/features/users/messages";
import type { User } from "@/features/users/types";
import { workspaceMessages } from "@/features/workspace/messages";
import { ApiClientError } from "@/lib/api-client";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

function createSchema(passwordHint: string) {
  return z.object({ password: z.string().min(12, { message: passwordHint }).max(128) });
}

type FormValues = z.infer<ReturnType<typeof createSchema>>;

export function ResetPasswordDialog({
  user,
  open,
  onOpenChange,
}: {
  readonly user: User;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const m = useMessages(usersMessages).reset;
  const w = useMessages(workspaceMessages).common;
  const schema = createSchema(w.passwordHint);
  const reset = useResetUserPassword();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: "" } });

  function changeOpen(next: boolean) {
    if (!next && reset.isPending) return;
    onOpenChange(next);
    if (!next) {
      form.reset({ password: "" });
      reset.reset();
    }
  }

  function onSubmit(values: FormValues) {
    reset.mutate(
      { userId: user.id, password: values.password },
      {
        onSuccess: ({ message }) => {
          toast.success(message);
          changeOpen(false);
        },
        onError: (error) => {
          const fieldMessage = error instanceof ApiClientError ? error.fieldErrors.password?.[0] : undefined;
          if (fieldMessage) form.setError("password", { message: fieldMessage });
          else toast.error(error.message);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="sm:max-w-md">
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{interpolate(m.title, { name: user.name })}</DialogTitle>
            <DialogDescription>{m.description}</DialogDescription>
          </DialogHeader>

          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="reset-password">{m.password}</FieldLabel>
                <PasswordInput
                  showLabel={w.showPassword}
                  hideLabel={w.hidePassword}
                  {...field}
                  id="reset-password"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>{w.passwordHint}</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={reset.isPending}>
                {w.cancel}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={reset.isPending}>
              {reset.isPending && <Spinner data-icon="inline-start" />}
              {m.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
