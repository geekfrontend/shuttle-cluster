"use client";

import { useState } from "react";

import { cn } from "cn";
import { CalendarRange, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { clusteringMessages } from "@/features/clustering/messages";
import {
  type DataRange,
  matchingPreset,
  type Period,
  type PeriodPreset,
  periodPresets,
  presetPeriod,
} from "@/lib/clustering/period";
import { useMessages } from "@/lib/i18n/locale-provider";
import { interpolate } from "@/lib/i18n/ui";

import { useClusterFormat } from "./cluster-format";

/** Kunci stabil shortcut, mis. `m12` atau `y2025`. */
const presetKey = (preset: PeriodPreset) => (preset.kind === "year" ? `y${preset.year}` : `m${preset.months}`);

/**
 * Pemilih periode: shortcut N bulan terakhir & per tahun (dihitung dari rentang data kategori), atau tanggal
 * mulai & akhir sendiri. `value` = periode yang sedang dipakai hasil clustering.
 */
export function PeriodPicker({
  value,
  range,
  onChange,
}: {
  readonly value: Period | null;
  readonly range: DataRange | null;
  readonly onChange: (period: Period) => void;
}) {
  const m = useMessages(clusteringMessages).filters;
  const format = useClusterFormat();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Period>({ from: "", to: "" });

  const presets = range ? periodPresets(range) : [];
  const active = value && range ? matchingPreset(value, range) : null;
  const activeKey = active ? presetKey(active) : null;
  const presetLabel = (preset: PeriodPreset) =>
    preset.kind === "months" ? interpolate(m.lastMonths, { months: preset.months }) : String(preset.year);

  let label = m.period;
  if (active) label = presetLabel(active);
  else if (value) label = `${format.date(value.from)} – ${format.date(value.to)}`;

  const draftInvalid = draft.from !== "" && draft.to !== "" && draft.to < draft.from;

  function choose(period: Period) {
    onChange(period);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Isian rentang sendiri dimulai dari periode yang sedang dipakai.
        if (next) setDraft(value ?? { from: range?.first ?? "", to: range?.last ?? "" });
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={!range} className="justify-between gap-2 font-normal">
          <CalendarRange className="text-muted-foreground" />
          <span className="truncate">{label}</span>
          {active && value && (
            <span className="hidden text-muted-foreground text-xs tabular-nums md:inline">
              {format.date(value.from)} – {format.date(value.to)}
            </span>
          )}
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(36rem,calc(100vw-2rem))] gap-0 p-0">
        <div className="grid sm:grid-cols-[13rem_minmax(0,1fr)]">
          <div className="grid content-start gap-3 border-b p-3 sm:border-r sm:border-b-0">
            <PresetGroup title={m.recent}>
              {presets
                .filter((preset) => preset.kind === "months")
                .map((preset) => (
                  <PresetButton
                    key={presetKey(preset)}
                    active={activeKey === presetKey(preset)}
                    onClick={() => range && choose(presetPeriod(preset, range))}
                  >
                    {presetLabel(preset)}
                  </PresetButton>
                ))}
            </PresetGroup>
            <PresetGroup title={m.years}>
              <ScrollArea className="h-40">
                <div className="grid grid-cols-3 gap-1 pr-3">
                  {presets
                    .filter((preset) => preset.kind === "year")
                    .map((preset) => (
                      <PresetButton
                        key={presetKey(preset)}
                        active={activeKey === presetKey(preset)}
                        className="justify-center tabular-nums"
                        onClick={() => range && choose(presetPeriod(preset, range))}
                      >
                        {presetLabel(preset)}
                      </PresetButton>
                    ))}
                </div>
              </ScrollArea>
            </PresetGroup>
          </div>

          <form
            noValidate
            className="grid content-start gap-3 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (draft.from && draft.to && !draftInvalid) choose(draft);
            }}
          >
            <p className="font-medium text-xs">{m.custom}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="period-from">{m.startDate}</FieldLabel>
                <Input
                  id="period-from"
                  type="date"
                  min={range?.first}
                  max={range?.last}
                  value={draft.from}
                  onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
                />
              </Field>
              <Field data-invalid={draftInvalid || undefined}>
                <FieldLabel htmlFor="period-to">{m.endDate}</FieldLabel>
                <Input
                  id="period-to"
                  type="date"
                  min={range?.first}
                  max={range?.last}
                  value={draft.to}
                  aria-invalid={draftInvalid}
                  onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
                />
              </Field>
            </div>
            {draftInvalid && <FieldError>{m.invalidRange}</FieldError>}
            <Button
              type="submit"
              size="sm"
              className="justify-self-end"
              disabled={!draft.from || !draft.to || draftInvalid}
            >
              {m.apply}
            </Button>
            {range && (
              <>
                <Separator />
                <p className="text-[0.625rem] text-muted-foreground leading-relaxed">
                  {interpolate(m.dataRange, { first: format.date(range.first), last: format.date(range.last) })}
                </p>
              </>
            )}
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PresetGroup({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <p className="font-medium text-[0.625rem] text-muted-foreground uppercase tracking-wider">{title}</p>
      <div className="grid gap-1">{children}</div>
    </div>
  );
}

function PresetButton({
  active,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { readonly active: boolean }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "secondary" : "ghost"}
      aria-pressed={active}
      className={cn("justify-start font-normal", active && "font-medium", className)}
      {...props}
    />
  );
}
