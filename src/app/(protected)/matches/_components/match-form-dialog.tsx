"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Plus } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { clusteringMessages } from "@/features/clustering/messages";
import { useCreateMatch } from "@/features/matches/hooks/use-match-mutations";
import { type MatchesMessages, matchesMessages } from "@/features/matches/messages";
import type { MatchPlayer } from "@/features/matches/types";
import { workspaceMessages } from "@/features/workspace/messages";
import { CATEGORIES, CATEGORY_CODES, type CategoryCode } from "@/lib/badminton/categories";
import { MAX_GAMES, slotGenders } from "@/lib/badminton/match-rules";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

import { PlayerPicker } from "./player-picker";

const categoryOf = (code: CategoryCode) => CATEGORIES.find((category) => category.code === code) ?? CATEGORIES[0];

const playerSchema = z.object({ id: z.string(), name: z.string(), country: z.string().nullable() }).nullable();
/** Skor game dari input teks: kosong = game tidak dimainkan. */
const scoreSchema = z.string().regex(/^\d{0,2}$/);

function createSchema(m: MatchesMessages["form"]) {
  return z
    .object({
      category: z.enum(CATEGORY_CODES),
      tournament: z.string().trim().min(1, { message: m.tournamentRequired }).max(160),
      round: z.string().trim().max(60),
      playedOn: z.string().min(1, { message: m.playedOnRequired }),
      sideA: z.array(playerSchema),
      sideB: z.array(playerSchema),
      games: z.array(z.object({ scoreA: scoreSchema, scoreB: scoreSchema })),
      retired: z.boolean(),
      winner: z.enum(["", "a", "b"]),
    })
    .superRefine((values, ctx) => {
      const size = categoryOf(values.category).unitSize;
      for (const side of ["sideA", "sideB"] as const) {
        if (values[side].slice(0, size).some((player) => player === null)) {
          ctx.addIssue({ code: "custom", path: [side], message: m.playerRequired });
        }
      }
    });
}

type FormValues = z.infer<ReturnType<typeof createSchema>>;

/** Tanggal lokal hari ini, `YYYY-MM-DD`. */
const today = () => new Date().toLocaleDateString("en-CA");

function defaults(category: CategoryCode = "MS"): FormValues {
  return {
    category,
    tournament: "",
    round: "",
    playedOn: today(),
    sideA: [null, null],
    sideB: [null, null],
    games: Array.from({ length: MAX_GAMES }, () => ({ scoreA: "", scoreB: "" })),
    retired: false,
    winner: "",
  };
}

const SIDES = ["sideA", "sideB"] as const;

export function MatchFormDialog() {
  const m = useMessages(matchesMessages);
  const c = useMessages(clusteringMessages);
  const w = useMessages(workspaceMessages);
  const [open, setOpen] = useState(false);
  const create = useCreateMatch();
  const form = useForm<FormValues>({ resolver: zodResolver(createSchema(m.form)), defaultValues: defaults() });

  const [categoryCode, sideA, sideB, retired] = useWatch({
    control: form.control,
    name: ["category", "sideA", "sideB", "retired"],
  });
  const category = categoryOf(categoryCode);
  const genders = slotGenders(category);
  const sides = { sideA, sideB };
  const pickedIds = [...sides.sideA, ...sides.sideB].flatMap((player) => (player ? [player.id] : []));

  function onOpenChange(next: boolean) {
    if (!next && create.isPending) return;
    setOpen(next);
    if (!next) {
      form.reset(defaults());
      create.reset();
    }
  }

  function onSubmit(values: FormValues) {
    const size = categoryOf(values.category).unitSize;
    const ids = (side: (MatchPlayer | null)[]) => side.slice(0, size).flatMap((player) => (player ? [player.id] : []));
    const games = values.games
      .filter((game) => game.scoreA !== "" || game.scoreB !== "")
      .map((game) => ({ scoreA: Number(game.scoreA || 0), scoreB: Number(game.scoreB || 0) }));

    create.mutate(
      {
        category: values.category,
        tournament: values.tournament,
        round: values.round || null,
        playedOn: values.playedOn,
        sideA: ids(values.sideA),
        sideB: ids(values.sideB),
        games,
        retired: values.retired,
        winner: values.retired && values.winner ? values.winner : undefined,
      },
      {
        onSuccess: ({ message }) => {
          toast.success(message);
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          {m.list.add}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{m.form.title}</DialogTitle>
            <DialogDescription>{m.form.description}</DialogDescription>
          </DialogHeader>

          {create.isError && (
            <Alert variant="soft-destructive">
              <CircleAlert aria-hidden="true" />
              <AlertDescription>{create.error?.message}</AlertDescription>
            </Alert>
          )}

          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="match-category">{m.form.category}</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Komposisi pemain berbeda per kategori; pilihan lama tidak lagi sah.
                        form.setValue("sideA", [null, null]);
                        form.setValue("sideB", [null, null]);
                      }}
                    >
                      <SelectTrigger id="match-category" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            <span className="font-mono">{item.code}</span> · {c.categories[item.code].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>{c.categories[category.code].unit}</FieldDescription>
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="playedOn"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="match-date">{m.form.playedOn}</FieldLabel>
                    <Input {...field} id="match-date" type="date" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <Controller
                control={form.control}
                name="tournament"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="match-tournament">{m.form.tournament}</FieldLabel>
                    <Input {...field} id="match-tournament" autoComplete="off" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="round"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="match-round">{m.form.round}</FieldLabel>
                    <Input {...field} id="match-round" placeholder={m.form.roundPlaceholder} autoComplete="off" />
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {SIDES.map((side) => {
                const error = form.formState.errors[side];
                return (
                  <FieldSet key={side} className="gap-2 border p-3" data-invalid={error ? true : undefined}>
                    <FieldLegend variant="label">{side === "sideA" ? m.form.sideA : m.form.sideB}</FieldLegend>
                    {genders.map((gender, slot) => (
                      <PlayerPicker
                        // biome-ignore lint/suspicious/noArrayIndexKey: slot tetap (pemain 1 / pemain 2)
                        key={`${category.code}-${slot}`}
                        id={`match-${side}-${slot}`}
                        gender={gender}
                        value={sides[side][slot] ?? null}
                        exclude={pickedIds}
                        invalid={Boolean(error) && !sides[side][slot]}
                        onChange={(player) => {
                          const next = [...sides[side]];
                          next[slot] = player;
                          form.setValue(side, next, { shouldValidate: form.formState.isSubmitted });
                        }}
                      />
                    ))}
                    {error?.message && <FieldError>{error.message}</FieldError>}
                  </FieldSet>
                );
              })}
            </div>

            <FieldSet className="gap-2">
              <FieldLegend variant="label">{m.form.games}</FieldLegend>
              <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-3 gap-y-2">
                <span />
                <span className="text-muted-foreground text-xs">{m.form.sideA}</span>
                <span className="text-muted-foreground text-xs">{m.form.sideB}</span>
                {Array.from({ length: MAX_GAMES }, (_, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: urutan game tetap (1–3)
                  <div key={index} className="contents">
                    <span className="text-muted-foreground text-xs">
                      {interpolate(m.form.game, { number: index + 1 })}
                    </span>
                    {(["scoreA", "scoreB"] as const).map((score) => (
                      <Controller
                        key={score}
                        control={form.control}
                        name={`games.${index}.${score}`}
                        render={({ field }) => (
                          <Input
                            {...field}
                            inputMode="numeric"
                            maxLength={2}
                            aria-label={`${interpolate(m.form.game, { number: index + 1 })} · ${
                              score === "scoreA" ? m.form.sideA : m.form.sideB
                            }`}
                            className="font-mono tabular-nums"
                            onChange={(event) => field.onChange(event.target.value.replace(/\D/g, ""))}
                          />
                        )}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <FieldDescription>{m.form.gamesHint}</FieldDescription>
            </FieldSet>

            <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
              <Controller
                control={form.control}
                name="retired"
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Checkbox
                      id="match-retired"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor="match-retired">{m.form.retired}</FieldLabel>
                      <FieldDescription>{m.form.retiredHint}</FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              />
              {retired && (
                <Controller
                  control={form.control}
                  name="winner"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="match-winner">{m.form.winner}</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="match-winner" className="w-full">
                          <SelectValue placeholder={m.form.winner} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="a">{m.form.sideA}</SelectItem>
                          <SelectItem value="b">{m.form.sideB}</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              )}
            </div>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={create.isPending}>
                {w.common.cancel}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Spinner data-icon="inline-start" />}
              {m.form.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
