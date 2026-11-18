"use client";

import { useState } from "react";

import { cn } from "cn";
import { ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { matchesMessages } from "@/features/matches/messages";
import type { MatchPlayer } from "@/features/matches/types";
import { usePlayers } from "@/features/players/hooks/use-players";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Gender } from "@/lib/badminton/match-rules";
import { useMessages } from "@/lib/i18n/locale-provider";

/** Cari pemain dengan gender yang sesuai slot (mis. XD: slot 1 putra, slot 2 putri), lalu pilih satu. */
export function PlayerPicker({
  id,
  gender,
  value,
  exclude,
  invalid,
  onChange,
}: {
  readonly id: string;
  readonly gender: Gender;
  readonly value: MatchPlayer | null;
  /** Pemain yang sudah dipilih di slot lain — satu pemain tidak boleh tampil dua kali. */
  readonly exclude: string[];
  readonly invalid?: boolean;
  readonly onChange: (player: MatchPlayer) => void;
}) {
  const m = useMessages(matchesMessages).form;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const players = usePlayers({ page: 1, pageSize: 8, gender: [gender], q: q || undefined }, { enabled: open });
  const options = players.data?.items.filter((player) => !exclude.includes(player.id)) ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>{value ? value.name : m.pickPlayer}</span>
          <ChevronsUpDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-64 p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder={m.searchPlayer} value={search} onValueChange={setSearch} />
          <CommandList className="max-h-60">
            {players.isPending ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : (
              <CommandEmpty>{m.noPlayer}</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((player) => (
                <CommandItem
                  key={player.id}
                  value={player.id}
                  onSelect={() => {
                    onChange({ id: player.id, name: player.name, country: player.country });
                    setOpen(false);
                    setSearch("");
                  }}
                  className="gap-2"
                >
                  <span className="min-w-0 flex-1 truncate">{player.name}</span>
                  {player.country && <span className="font-mono text-muted-foreground text-xs">{player.country}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
