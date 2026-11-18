"use client";

import type { ReactNode } from "react";

import { CircleAlert, FileSpreadsheet, RefreshCw, SearchCheck } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { Spinner } from "@/components/ui/spinner";
import { useFormatters } from "@/hooks/use-formatters";

/** Divalidasi dari nama file: tebakan MIME browser untuk `.csv` tidak bisa diandalkan. */
const EXTENSIONS = [".csv", ".xlsx"];
/** Sama dengan `IMPORT_MAX_BYTES` di server. */
const MAX_BYTES = 2 * 1024 * 1024;

export type ImportFileCardLabels = {
  uploadTitle: string;
  uploadDescription: string;
  dropTitle: string;
  dropHint: string;
  dragHint: string;
  choose: string;
  cancel: string;
  fileInvalid: string;
  fileTooLarge: string;
  fileSelected: string;
  change: string;
  readyToCheck: string;
  checkHint: string;
  check: string;
  checking: string;
};

/**
 * Langkah unggah: pilih file CSV/XLSX lalu periksa. `actions` (panduan kolom, template) di header kartu.
 * `extensions` membatasi tipe file (mis. hanya `.xlsx`).
 */
export function ImportFileCard({
  labels: m,
  actions,
  extensions = EXTENSIONS,
  file,
  checking,
  error,
  onChoose,
  onReset,
  onCheck,
}: {
  readonly labels: ImportFileCardLabels;
  readonly actions?: ReactNode;
  readonly extensions?: readonly string[];
  readonly file: File | null;
  readonly checking: boolean;
  readonly error: string | null;
  readonly onChoose: (file: File) => void;
  readonly onReset: () => void;
  readonly onCheck: () => void;
}) {
  const format = useFormatters();

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>{m.uploadTitle}</CardTitle>
        <CardDescription>{m.uploadDescription}</CardDescription>
        {actions && <CardAction className="flex flex-wrap justify-end gap-2">{actions}</CardAction>}
      </CardHeader>
      <CardContent className="grid gap-4 py-5">
        {file ? (
          <div className="flex flex-col items-center gap-3 border border-dashed bg-muted/30 px-6 py-10 text-center">
            <span className="flex size-12 items-center justify-center bg-primary/10 text-primary">
              <FileSpreadsheet className="size-6" aria-hidden="true" />
            </span>
            <span className="grid gap-0.5">
              <span className="break-all font-medium">{file.name}</span>
              <span className="text-muted-foreground text-xs">
                {m.fileSelected} · {format.number(Math.max(1, Math.ceil(file.size / 1024)))} KB
              </span>
            </span>
            <Button type="button" size="sm" variant="outline" onClick={onReset} disabled={checking}>
              <RefreshCw data-icon="inline-start" />
              {m.change}
            </Button>
          </div>
        ) : (
          <FileUpload
            className="max-w-none"
            maxFileSize={Number.MAX_SAFE_INTEGER}
            uploadDelay={600}
            validateFile={(candidate) => {
              const name = candidate.name.toLowerCase();
              if (!extensions.some((extension) => name.endsWith(extension))) {
                return { code: "INVALID_FILE_TYPE", message: m.fileInvalid };
              }
              if (candidate.size > MAX_BYTES) return { code: "FILE_TOO_LARGE", message: m.fileTooLarge };
              return null;
            }}
            onUploadSuccess={onChoose}
            labels={{
              title: m.dropTitle,
              hint: m.dropHint,
              action: m.choose,
              dropHint: m.dragHint,
              cancel: m.cancel,
            }}
          />
        )}

        {error && (
          <Alert variant="soft-destructive">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">{file ? m.readyToCheck : m.checkHint}</p>
          <Button className="sm:min-w-40" disabled={!file || checking} onClick={onCheck}>
            {checking ? <Spinner data-icon="inline-start" /> : <SearchCheck data-icon="inline-start" />}
            {checking ? m.checking : m.check}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
