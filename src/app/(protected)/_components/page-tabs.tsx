"use client";

import { type ReactNode, useCallback, useLayoutEffect, useRef, useState } from "react";

import { cn } from "cn";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** `icon` berupa elemen (mis. `<Building2 />`) karena komponen tidak bisa dikirim dari Server Component. */
export type PageTab = { value: string; label: string; icon?: ReactNode; content: ReactNode };

/** Posisi & ukuran indikator di sumbu tab (left/width untuk horizontal, top/height untuk vertikal). */
type Indicator = { offset: number; size: number };

// Kurva ease-out yang lembut untuk indikator dan isi tab.
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/**
 * Tab tingkat halaman dengan indikator yang meluncur ke tab aktif dan isi yang masuk searah
 * perpindahan. `orientation="vertical"` menaruh tab sebagai sidebar di kiri (menempel saat scroll).
 * Tab aktif disimpan di `?tab=` (bisa ditautkan, bertahan saat reload). `content` boleh Server
 * Component — dirender di server, hanya pergantian tab yang terjadi di client.
 */
export function PageTabs({
  tabs,
  initialTab,
  orientation = "horizontal",
}: {
  readonly tabs: PageTab[];
  readonly initialTab?: string;
  readonly orientation?: "horizontal" | "vertical";
}) {
  const vertical = orientation === "vertical";
  const fallback = tabs[0]?.value ?? "";
  const [value, setValue] = useState(tabs.some((tab) => tab.value === initialTab) ? (initialTab as string) : fallback);
  const [direction, setDirection] = useState<"forward" | "backward" | null>(null);
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  // Transisi baru aktif setelah posisi awal terukur, agar indikator tidak meluncur dari awal saat pertama tampil.
  const [animated, setAnimated] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());

  const measure = useCallback(() => {
    const trigger = triggerRefs.current.get(value);
    if (!trigger) return;
    setIndicator(
      vertical
        ? { offset: trigger.offsetTop, size: trigger.offsetHeight }
        : { offset: trigger.offsetLeft, size: trigger.offsetWidth },
    );
  }, [value, vertical]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // Ukur ulang saat ukuran berubah (resize, font selesai dimuat, ganti bahasa).
    const observer = new ResizeObserver(() => measure());
    observer.observe(list);
    const frame = requestAnimationFrame(() => setAnimated(true));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [measure]);

  function change(next: string) {
    const from = tabs.findIndex((tab) => tab.value === value);
    const to = tabs.findIndex((tab) => tab.value === next);
    setDirection(to > from ? "forward" : "backward");
    setValue(next);

    const url = new URL(window.location.href);
    if (next === fallback) url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(window.history.state, "", url);
  }

  const motion = animated
    ? cn(
        vertical ? "transition-[top,height]" : "transition-[left,width]",
        "duration-300 motion-reduce:transition-none",
        EASE,
      )
    : "";
  let position: { top: number; height: number } | { left: number; width: number } | undefined;
  if (indicator) {
    position = vertical
      ? { top: indicator.offset, height: indicator.size }
      : { left: indicator.offset, width: indicator.size };
  }

  return (
    <Tabs
      value={value}
      onValueChange={change}
      orientation={orientation}
      className={cn(vertical ? "grid items-start gap-5 md:grid-cols-[13rem_minmax(0,1fr)]" : "gap-5")}
    >
      {/* Garis dasar digambar di TabsList (inset shadow) supaya indikator menimpanya persis. */}
      <div className={cn(vertical ? "md:sticky md:top-4" : "overflow-x-auto")}>
        <TabsList
          ref={listRef}
          variant="line"
          className={cn(
            "relative w-full gap-0 p-0",
            vertical
              ? "h-fit flex-col items-stretch shadow-[inset_1px_0_0_var(--border)]"
              : "h-10 justify-start shadow-[inset_0_-1px_0_var(--border)]",
          )}
        >
          {indicator && (
            <span
              aria-hidden="true"
              className={cn("pointer-events-none absolute bg-primary/6", vertical ? "inset-x-0" : "inset-y-0", motion)}
              style={position}
            />
          )}
          {tabs.map(({ value: tabValue, label, icon }) => (
            <TabsTrigger
              key={tabValue}
              value={tabValue}
              ref={(node) => {
                if (node) triggerRefs.current.set(tabValue, node);
                else triggerRefs.current.delete(tabValue);
              }}
              className={cn(
                "relative z-10 flex-none gap-1.5 border-0 text-muted-foreground transition-colors duration-200 after:hidden [&_svg]:size-4",
                "hover:bg-muted/40 hover:text-foreground data-active:text-foreground data-active:[&_svg]:text-primary",
                vertical ? "h-9 w-full justify-start px-3" : "h-full px-3",
              )}
            >
              {icon}
              {label}
            </TabsTrigger>
          ))}
          {indicator && (
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute z-20 bg-primary",
                vertical ? "left-0 w-0.5" : "bottom-0 h-0.5",
                motion,
              )}
              style={position}
            />
          )}
        </TabsList>
      </div>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className={cn(
            "grid min-w-0 content-start gap-4 duration-300 motion-reduce:animate-none",
            // Mode samping: garis pemisah vertikal antara daftar tab dan isinya.
            vertical && "md:min-h-64 md:border-l md:pl-5",
            EASE,
            direction && "fade-in-0 animate-in",
            direction === "forward" && (vertical ? "slide-in-from-bottom-3" : "slide-in-from-right-4"),
            direction === "backward" && (vertical ? "slide-in-from-top-3" : "slide-in-from-left-4"),
          )}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
