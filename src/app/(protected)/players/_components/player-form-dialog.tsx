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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useCreatePlayer, useUpdatePlayer } from "@/features/players/hooks/use-player-mutations";
import { type PlayersMessages, playersMessages } from "@/features/players/messages";
import type { Player } from "@/features/players/types";
import { workspaceMessages } from "@/features/workspace/messages";
import { ApiClientError } from "@/lib/api-client";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

function createSchema(m: PlayersMessages["form"]) {
  return z.object({
    name: z.string().trim().min(1, { message: m.nameRequired }).max(120),
    gender: z.enum(["male", "female"]),
    country: z
      .string()
      .trim()
      .refine((value) => value === "" || /^[A-Za-z]{3}$/.test(value), { message: m.countryInvalid }),
    externalId: z.string().trim().max(64),
  });
}

type FormValues = z.infer<ReturnType<typeof createSchema>>;

const FIELDS = ["name", "gender", "country", "externalId"] as const;

function defaultsOf(player?: Player): FormValues {
  return {
    name: player?.name ?? "",
    gender: player?.gender ?? "male",
    country: player?.country ?? "",
    externalId: player?.externalId ?? "",
  };
}

/**
 * Tambah pemain (dengan tombol pemicu) atau ubah pemain (`player` + `open` dikendalikan pemanggil,
 * mis. dari menu baris tabel).
 */
export function PlayerFormDialog({
  player,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  readonly player?: Player;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}) {
  const m = useMessages(playersMessages);
  const w = useMessages(workspaceMessages);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const isEdit = player !== undefined;
  const create = useCreatePlayer();
  const update = useUpdatePlayer();
  const mutation = isEdit ? update : create;
  const form = useForm<FormValues>({ resolver: zodResolver(createSchema(m.form)), defaultValues: defaultsOf(player) });

  function onOpenChange(next: boolean) {
    if (!next && mutation.isPending) return;
    setOpen(next);
    if (!next) {
      form.reset(defaultsOf(player));
      mutation.reset();
    }
  }

  function onSubmit(values: FormValues) {
    const request = {
      name: values.name,
      gender: values.gender,
      country: values.country ? values.country.toUpperCase() : null,
      externalId: values.externalId || null,
    };
    const handlers = {
      onSuccess: ({ message }: { message: string }) => {
        toast.success(message);
        onOpenChange(false);
      },
      onError: (error: Error) => {
        if (!(error instanceof ApiClientError)) return;
        for (const field of FIELDS) {
          const messages = error.fieldErrors[field];
          if (messages?.length) form.setError(field, { message: messages[0] });
        }
      },
    };
    if (isEdit) update.mutate({ playerId: player.id, ...request }, handlers);
    else create.mutate(request, handlers);
  }

  const fieldError = mutation.error instanceof ApiClientError ? mutation.error : null;
  const showErrorAlert = mutation.isError && !FIELDS.some((field) => fieldError?.fieldErrors[field]?.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button>
            <Plus data-icon="inline-start" />
            {m.list.add}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? interpolate(m.form.editTitle, { name: player.name }) : m.form.createTitle}
            </DialogTitle>
            <DialogDescription>{isEdit ? m.form.editDescription : m.form.createDescription}</DialogDescription>
          </DialogHeader>

          {showErrorAlert && (
            <Alert variant="soft-destructive">
              <CircleAlert aria-hidden="true" />
              <AlertDescription>{mutation.error?.message}</AlertDescription>
            </Alert>
          )}

          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="player-name">{m.form.name}</FieldLabel>
                  <Input {...field} id="player-name" autoComplete="off" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="player-gender">{m.form.gender}</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="player-gender" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{m.genders.male}</SelectItem>
                        <SelectItem value="female">{m.genders.female}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="country"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="player-country">{m.form.country}</FieldLabel>
                    <Input
                      {...field}
                      id="player-country"
                      maxLength={3}
                      placeholder={w.common.optional}
                      className="font-mono uppercase placeholder:font-sans placeholder:normal-case"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>{m.form.countryHint}</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <Controller
              control={form.control}
              name="externalId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="player-external-id">{m.form.externalId}</FieldLabel>
                  <Input
                    {...field}
                    id="player-external-id"
                    placeholder={w.common.optional}
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>{m.form.externalIdHint}</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={mutation.isPending}>
                {w.common.cancel}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner data-icon="inline-start" />}
              {isEdit ? m.form.save : m.form.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
