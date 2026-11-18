"use client";

import { useMemo } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { useLogin } from "@/features/auth/hooks/use-login";
import { type AuthMessages, authMessages } from "@/features/auth/messages";
import { workspaceMessages } from "@/features/workspace/messages";
import { ApiClientError } from "@/lib/api-client";
import { useMessages } from "@/lib/i18n/locale-provider";

import { LoginFeedback } from "./login-feedback";

function createFormSchema(m: AuthMessages["login"]) {
  return z.object({
    email: z.email({ message: m.emailInvalid }),
    password: z.string().min(1, { message: m.passwordRequired }),
  });
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

export function LoginForm({ next }: { readonly next: string }) {
  const router = useRouter();
  const { login: m, feedback } = useMessages(authMessages);
  const pwCommon = useMessages(workspaceMessages).common;
  const pw = { show: pwCommon.showPassword, hide: pwCommon.hidePassword };
  const formSchema = useMemo(() => createFormSchema(m), [m]);
  const login = useLogin();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: FormValues) {
    login.mutate(values, {
      onSuccess: () => {
        router.replace(next);
        router.refresh();
      },
      onError: (error) => {
        if (!(error instanceof ApiClientError)) return;
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field === "email" || field === "password") form.setError(field, { message: messages[0] });
        }
      },
    });
  }

  // Tetap nonaktif setelah sukses sampai navigasi selesai.
  const busy = login.isPending || login.isSuccess;

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* `key` memicu ulang animasi di setiap percobaan login. */}
      <LoginFeedback key={login.submittedAt} m={feedback} error={login.error} success={login.isSuccess} />
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-email">{m.emailLabel}</FieldLabel>
              <Input
                {...field}
                id="login-email"
                type="email"
                placeholder={m.emailPlaceholder}
                autoComplete="email"
                className="h-11"
                disabled={busy}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-password">{m.passwordLabel}</FieldLabel>
              <PasswordInput
                showLabel={pw.show}
                hideLabel={pw.hide}
                {...field}
                id="login-password"
                placeholder="••••••••"
                autoComplete="current-password"
                containerClassName="h-11"
                disabled={busy}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button className="mt-2 w-full" size="lg" type="submit" disabled={busy}>
        {busy && <Spinner data-icon="inline-start" />}
        {m.submit}
      </Button>
    </form>
  );
}
