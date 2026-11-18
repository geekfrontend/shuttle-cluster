"use client";

import type { LucideIcon } from "lucide-react";
import { CheckCheck, CircleAlert, LockKeyhole, Timer, TriangleAlert, WifiOff } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AuthMessages } from "@/features/auth/messages";
import { ApiClientError } from "@/lib/api-client";

type Variant = "soft-destructive" | "soft-warning" | "soft-info" | "soft-success";

type Feedback = { variant: Variant; icon: LucideIcon; title: string; description: string };

/** Petakan hasil login ke tampilan alert. Pesan error dari API sudah diterjemahkan server. */
function toFeedback(m: AuthMessages["feedback"], error: unknown): Feedback {
  if (!(error instanceof ApiClientError)) {
    return {
      variant: "soft-destructive",
      icon: TriangleAlert,
      title: m.genericTitle,
      description: m.genericDescription,
    };
  }
  switch (error.code) {
    case "auth.account_locked":
      return { variant: "soft-warning", icon: LockKeyhole, title: m.lockedTitle, description: error.message };
    case "error.too_many_requests":
      return { variant: "soft-warning", icon: Timer, title: m.rateLimitedTitle, description: error.message };
    case "error.network":
      return { variant: "soft-info", icon: WifiOff, title: m.networkTitle, description: m.networkDescription };
    case "auth.invalid_credentials":
      return { variant: "soft-destructive", icon: CircleAlert, title: m.invalidTitle, description: error.message };
    default:
      return { variant: "soft-destructive", icon: TriangleAlert, title: m.genericTitle, description: error.message };
  }
}

export function LoginFeedback({
  m,
  error,
  success,
}: {
  readonly m: AuthMessages["feedback"];
  readonly error: unknown;
  readonly success: boolean;
}) {
  if (!success && !error) return null;

  const feedback: Feedback = success
    ? { variant: "soft-success", icon: CheckCheck, title: m.successTitle, description: m.successDescription }
    : toFeedback(m, error);

  return (
    <Alert
      role={success ? "status" : "alert"}
      variant={feedback.variant}
      // `key` di pemanggil memicu ulang animasi ini di setiap percobaan login.
      className="fade-in-0 slide-in-from-top-2 animate-in duration-300"
    >
      <AlertTitle>{feedback.title}</AlertTitle>
      <AlertDescription>{feedback.description}</AlertDescription>
    </Alert>
  );
}
