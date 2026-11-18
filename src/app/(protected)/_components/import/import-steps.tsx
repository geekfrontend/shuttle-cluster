import { cn } from "cn";
import { Check } from "lucide-react";

export type ImportStep = "upload" | "review" | "done";
const STEPS: ImportStep[] = ["upload", "review", "done"];

/** Tiga segmen sama lebar: bilah progres di atas, nomor/centang, label, dan keterangan singkat per langkah. */
export function ImportSteps({
  step,
  label,
  steps,
  hints,
}: {
  readonly step: ImportStep;
  readonly label: string;
  readonly steps: Record<ImportStep, string>;
  readonly hints: Record<ImportStep, string>;
}) {
  const currentIndex = STEPS.indexOf(step);
  return (
    <ol className="grid grid-cols-3 gap-2 sm:gap-3" aria-label={label}>
      {STEPS.map((item, index) => {
        const current = index === currentIndex;
        const done = index < currentIndex;
        return (
          <li
            key={item}
            aria-current={current ? "step" : undefined}
            className={cn(
              "flex min-w-0 items-start gap-2.5 border-t-2 pt-3 transition-colors",
              done || current ? "border-primary" : "border-border",
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center font-medium text-xs tabular-nums transition-colors",
                done && "bg-primary text-primary-foreground",
                current && "bg-primary text-primary-foreground",
                !done && !current && "border bg-background text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
            </span>
            <span className="grid min-w-0 leading-tight">
              <span className={cn("truncate font-medium text-sm", !done && !current && "text-muted-foreground")}>
                {steps[item]}
              </span>
              <span className="hidden truncate text-muted-foreground text-xs sm:block">{hints[item]}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
