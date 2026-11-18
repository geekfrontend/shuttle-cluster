"use client";

/**
 * @author: @dorianbaffier
 * @description: File Upload
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 *
 * Adapted for this repo: `cn` comes from the `cn` package (as every other local component here
 * imports it), and the interval handle is typed `ReturnType<typeof setInterval>` rather than
 * `NodeJS.Timeout` — this file only runs in the browser, where `setInterval` returns a number,
 * not a Node timer.
 *
 * The three surfaces — outer card, inset, dropzone — were `bg-white`/`bg-gray-50`/`dark:bg-black`.
 * Swapped for `bg-card`/`bg-muted`/`bg-background` so the control sits on the app's own surfaces:
 * the hardcoded black read as a hole punched through any dark panel it was placed in. The blue
 * accents on the illustration are left alone — they are the component's character, not its chrome.
 * Corners follow this project's `rounded-none` shape language instead of upstream's rounded pills.
 *
 * Note that the progress here is a **simulation**: `simulateUpload` runs a timer and then calls
 * `onUploadSuccess` with the file. Nothing is sent anywhere. Treat `onUploadSuccess` as "the user
 * picked this file" and do the real work — a request, a parse — there.
 */

import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { FileText, UploadCloud, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "cn";

import { Button } from "./button";

type FileStatus = "idle" | "dragging" | "uploading" | "error";

interface FileError {
  message: string;
  code: string;
}

interface FileUploadProps {
  onUploadSuccess?: (file: File) => void;
  onUploadError?: (error: FileError) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  currentFile?: File | null;
  onFileRemove?: () => void;
  /** Duration in milliseconds for the upload simulation. Defaults to 2000ms (2s), 0 for no simulation */
  uploadDelay?: number;
  validateFile?: (file: File) => FileError | null;
  className?: string;
  /**
   * Accept more than one file at a time.
   *
   * The two modes differ in what happens *after* a file is accepted, not in how one is picked. Single
   * hands the file over and returns to the dropzone, holding nothing — the caller owns what was
   * chosen. Multiple keeps the accepted files listed under the dropzone, because a set being built up
   * has to stay visible and removable while it is being built.
   */
  multiple?: boolean;
  /** Multiple mode only: a listed file was removed. Single mode reports through `onFileRemove`. */
  onFileListChange?: (files: File[]) => void;
  /**
   * Every visible string, so a localised app can pass its own.
   *
   * Added on top of the upstream component, which hardcodes English. `hint` replaces the whole
   * "SVG, PNG, JPG or GIF up to 5 MB" line rather than adding to it: that line is assembled from
   * `acceptedFileTypes`, and a caller that validates by filename instead — as a CSV import must,
   * since the browser's MIME guess for `.csv` is not dependable — would otherwise advertise image
   * formats it does not accept.
   */
  labels?: {
    title?: string;
    hint?: string;
    action?: string;
    dropHint?: string;
    cancel?: string;
    remove?: string;
  };
}

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_STEP_SIZE = 5;
const FILE_SIZES = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"] as const;

const formatBytes = (bytes: number, decimals = 2): string => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unit = FILE_SIZES[i] || FILE_SIZES[FILE_SIZES.length - 1];
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${unit}`;
};

const UploadIllustration = () => (
  <div className="relative h-16 w-16">
    <svg aria-label="Upload illustration" className="h-full w-full" fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <title>Upload File Illustration</title>
      <circle className="stroke-border" cx="50" cy="50" r="45" strokeDasharray="4 4" strokeWidth="2">
        <animateTransform
          attributeName="transform"
          dur="60s"
          from="0 50 50"
          repeatCount="indefinite"
          to="360 50 50"
          type="rotate"
        />
      </circle>

      <path
        className="fill-primary/10 stroke-primary"
        d="M30 35H70C75 35 75 40 75 40V65C75 70 70 70 70 70H30C25 70 25 65 25 65V40C25 35 30 35 30 35Z"
        strokeWidth="2"
      >
        <animate
          attributeName="d"
          dur="2s"
          repeatCount="indefinite"
          values="
                        M30 35H70C75 35 75 40 75 40V65C75 70 70 70 70 70H30C25 70 25 65 25 65V40C25 35 30 35 30 35Z;
                        M30 38H70C75 38 75 43 75 43V68C75 73 70 73 70 73H30C25 73 25 68 25 68V43C25 38 30 38 30 38Z;
                        M30 35H70C75 35 75 40 75 40V65C75 70 70 70 70 70H30C25 70 25 65 25 65V40C25 35 30 35 30 35Z"
        />
      </path>

      <path
        className="stroke-primary"
        d="M30 35C30 35 35 35 40 35C45 35 45 30 50 30C55 30 55 35 60 35C65 35 70 35 70 35"
        fill="none"
        strokeWidth="2"
      />

      <g className="translate-y-2 transform">
        <line className="stroke-primary" strokeLinecap="round" strokeWidth="2" x1="50" x2="50" y1="45" y2="60">
          <animate attributeName="y2" dur="2s" repeatCount="indefinite" values="60;55;60" />
        </line>
        <polyline
          className="stroke-primary"
          fill="none"
          points="42,52 50,45 58,52"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <animate
            attributeName="points"
            dur="2s"
            repeatCount="indefinite"
            values="42,52 50,45 58,52;42,47 50,40 58,47;42,52 50,45 58,52"
          />
        </polyline>
      </g>
    </svg>
  </div>
);

/**
 * A single-hue progress ring.
 *
 * Upstream draws fourteen concentric circles in fourteen hardcoded hex colours, spinning in
 * alternating directions behind a mask. It is striking and it belongs to no design system: none of
 * those hues exist in this app's palette, and a progress readout that cycles through the spectrum
 * encodes nothing — the number it is reporting is one value on one scale. One track, one arc, the
 * brand hue.
 */
const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const UploadingAnimation = ({ progress }: { progress: number }) => (
  <div className="relative size-16">
    <svg
      aria-label={`Upload progress: ${Math.round(progress)}%`}
      className="size-full -rotate-90"
      fill="none"
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Upload Progress Indicator</title>
      <circle className="stroke-muted" cx="40" cy="40" r={RING_RADIUS} strokeWidth="6" />
      <circle
        className="stroke-primary transition-[stroke-dashoffset] duration-200 ease-out"
        cx="40"
        cy="40"
        r={RING_RADIUS}
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={RING_CIRCUMFERENCE * (1 - Math.min(Math.max(progress, 0), 100) / 100)}
        strokeLinecap="round"
        strokeWidth="6"
      />
    </svg>
  </div>
);

function FileUpload({
  onUploadSuccess = () => {},
  onUploadError = () => {},
  acceptedFileTypes = [],
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  currentFile: initialFile = null,
  onFileRemove = () => {},
  uploadDelay = 2000,
  validateFile = () => null,
  className,
  labels,
  multiple = false,
  onFileListChange,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(initialFile);
  const [status, setStatus] = useState<FileStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<FileError | null>(null);
  /** Multiple mode only — the set built so far. Single mode never adds to it. */
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
    },
    [],
  );

  const validateFileSize = useCallback(
    (file: File): FileError | null => {
      if (file.size > maxFileSize) {
        return {
          message: `File size exceeds ${formatBytes(maxFileSize)}`,
          code: "FILE_TOO_LARGE",
        };
      }
      return null;
    },
    [maxFileSize],
  );

  const validateFileType = useCallback(
    (file: File): FileError | null => {
      if (!acceptedFileTypes?.length) return null;

      const fileType = file.type.toLowerCase();
      if (!acceptedFileTypes.some((type) => fileType.match(type.toLowerCase()))) {
        return {
          message: `File type must be ${acceptedFileTypes.join(", ")}`,
          code: "INVALID_FILE_TYPE",
        };
      }
      return null;
    },
    [acceptedFileTypes],
  );

  const handleError = useCallback(
    (error: FileError) => {
      setError(error);
      setStatus("error");
      onUploadError?.(error);

      setTimeout(() => {
        setError(null);
        setStatus("idle");
      }, 3000);
    },
    [onUploadError],
  );

  const simulateUpload = useCallback(
    (uploadingFiles: File[]) => {
      let currentProgress = 0;

      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }

      uploadIntervalRef.current = setInterval(
        () => {
          currentProgress += UPLOAD_STEP_SIZE;
          if (currentProgress >= 100) {
            if (uploadIntervalRef.current) {
              clearInterval(uploadIntervalRef.current);
            }
            setProgress(0);
            setStatus("idle");
            setFile(null);
            for (const done of uploadingFiles) onUploadSuccess?.(done);
          } else {
            setStatus((prevStatus) => {
              if (prevStatus === "uploading") {
                setProgress(currentProgress);
                return "uploading";
              }
              if (uploadIntervalRef.current) {
                clearInterval(uploadIntervalRef.current);
              }
              return prevStatus;
            });
          }
        },
        uploadDelay / (100 / UPLOAD_STEP_SIZE),
      );
    },
    [onUploadSuccess, uploadDelay],
  );

  /** Every check a file has to clear, in the order the reader should hear about them. */
  const firstError = useCallback(
    (candidate: File) =>
      validateFileSize(candidate) ?? validateFileType(candidate) ?? validateFile?.(candidate) ?? null,
    [validateFileSize, validateFileType, validateFile],
  );

  const handleFileSelect = useCallback(
    (selected: File | File[] | null) => {
      const candidates = selected === null ? [] : Array.isArray(selected) ? selected : [selected];
      if (candidates.length === 0) return;

      setError(null);

      // One rejection stops the batch rather than importing the good half of a drop the reader
      // believed was accepted whole.
      for (const candidate of candidates) {
        const problem = firstError(candidate);
        if (problem) {
          handleError(problem);
          return;
        }
      }

      if (multiple) {
        setFiles((prev) => {
          const next = [...prev, ...candidates];
          onFileListChange?.(next);
          return next;
        });
      }

      // The progress runs once over the batch; it is a reading animation, not a per-file transfer.
      setFile(candidates[0] ?? null);
      setStatus("uploading");
      setProgress(0);
      simulateUpload(candidates);
    },
    [simulateUpload, firstError, handleError, multiple, onFileListChange],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus((prev) => (prev !== "uploading" ? "dragging" : prev));
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus((prev) => (prev === "dragging" ? "idle" : prev));
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (status === "uploading") return;
      setStatus("idle");
      const dropped = Array.from(e.dataTransfer.files ?? []);
      if (dropped.length > 0) handleFileSelect(multiple ? dropped : (dropped[0] ?? null));
    },
    [status, handleFileSelect, multiple],
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? []);
      handleFileSelect(multiple ? picked : (picked[0] ?? null));
      // Cleared so picking the same file twice in a row still fires a change event.
      if (e.target) e.target.value = "";
    },
    [handleFileSelect, multiple],
  );

  const triggerFileInput = useCallback(() => {
    if (status === "uploading") return;
    fileInputRef.current?.click();
  }, [status]);

  const resetState = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    if (onFileRemove) onFileRemove();
  }, [onFileRemove]);

  return (
    <div aria-label="File upload" className={cn("relative mx-auto w-full max-w-sm", className || "")} role="group">
      <div className="group relative w-full rounded-xl bg-card p-0.5 ring-1 ring-border">
        <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="relative w-full rounded-[10px] bg-muted/40 p-1.5">
          <div
            className={cn(
              "relative mx-auto w-full overflow-hidden rounded-lg border border-border bg-background",
              error ? "border-destructive/50" : "",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-300",
                status === "dragging" ? "opacity-100" : "opacity-0",
              )}
            >
              <div className="absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-primary/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-primary/10 to-transparent" />
              <div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-primary/10 to-transparent" />
              <div className="absolute inset-y-0 right-0 w-[20%] bg-gradient-to-l from-primary/10 to-transparent" />
              <div className="absolute inset-[20%] animate-pulse rounded-lg bg-primary/5 transition-all duration-300" />
            </div>

            <div className="absolute -top-4 -right-4 h-8 w-8 bg-gradient-to-br from-primary/20 to-transparent opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative h-[240px]">
              <AnimatePresence mode="wait">
                {status === "idle" || status === "dragging" ? (
                  <motion.div
                    animate={{
                      opacity: status === "dragging" ? 0.8 : 1,
                      y: 0,
                      scale: status === "dragging" ? 0.98 : 1,
                    }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-6"
                    exit={{ opacity: 0, y: -10 }}
                    initial={{ opacity: 0, y: 10 }}
                    key="dropzone"
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-4">
                      <UploadIllustration />
                    </div>

                    <div className="mb-4 space-y-1.5 text-center">
                      <h3 className="font-heading text-lg text-foreground tracking-tight">
                        {labels?.title ?? "Drag and drop or"}
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        {labels?.hint ?? (
                          <>
                            {acceptedFileTypes?.length
                              ? `${acceptedFileTypes
                                  .map((t) => t.split("/")[1])
                                  .join(", ")
                                  .toUpperCase()}`
                              : "SVG, PNG, JPG or GIF"}{" "}
                            {maxFileSize && `up to ${formatBytes(maxFileSize)}`}
                          </>
                        )}
                      </p>
                    </div>

                    <Button className="w-4/5" onClick={triggerFileInput} type="button" variant="secondary">
                      <span>{labels?.action ?? "Upload File"}</span>
                      <UploadCloud />
                    </Button>

                    <p className="mt-3 text-muted-foreground text-xs">
                      {labels?.dropHint ?? "or drag and drop your file here"}
                    </p>

                    <input
                      accept={acceptedFileTypes?.join(",")}
                      aria-label="File input"
                      multiple={multiple}
                      className="sr-only"
                      onChange={handleFileInputChange}
                      ref={fileInputRef}
                      type="file"
                    />
                  </motion.div>
                ) : status === "uploading" ? (
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-6"
                    exit={{ opacity: 0, scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    key="uploading"
                  >
                    <div className="mb-4">
                      <UploadingAnimation progress={progress} />
                    </div>

                    <div className="mb-4 space-y-1.5 text-center">
                      <h3 className="truncate font-medium text-foreground text-sm">{file?.name}</h3>
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className="text-muted-foreground">{formatBytes(file?.size || 0)}</span>
                        <span className="font-medium text-primary">{Math.round(progress)}%</span>
                      </div>
                    </div>

                    <Button className="w-4/5" onClick={resetState} type="button" variant="outline">
                      {labels?.cancel ?? "Cancel"}
                    </Button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {multiple && files.length > 0 ? (
              <ul className="divide-y divide-border/60 border-border/60 border-t">
                {files.map((listed, index) => (
                  <li key={`${listed.name}-${listed.lastModified}-${index}`} className="flex items-center gap-3 px-3 py-2">
                    <FileText aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm">{listed.name}</span>
                    <span className="shrink-0 text-muted-foreground text-xs">{formatBytes(listed.size)}</span>
                    <button
                      aria-label={`${labels?.remove ?? "Remove"} ${listed.name}`}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setFiles((prev) => {
                          const next = prev.filter((_, at) => at !== index);
                          onFileListChange?.(next);
                          return next;
                        });
                        onFileRemove?.();
                      }}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <AnimatePresence>
              {error && (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="-translate-x-1/2 absolute bottom-4 left-1/2 transform rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-2"
                  exit={{ opacity: 0, y: -10 }}
                  initial={{ opacity: 0, y: 10 }}
                >
                  <p className="text-destructive text-sm">{error.message}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

FileUpload.displayName = "FileUpload";

export { FileUpload };
export default FileUpload;
