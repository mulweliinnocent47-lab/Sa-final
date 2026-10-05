"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Lock, X } from "lucide-react";

// reason: "ai" | "download"
const COPY = {
  ai: {
    title: "Sign in to keep chatting",
    body: "You've used your 3 free messages. Create a free account or log in to continue with Practice AI.",
  },
  download: {
    title: "Sign in to download",
    body: "Downloading notes and past papers needs a free account. Sign up or log in to continue.",
  },
};

export function SignInPrompt({ open, reason = "download", onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const { title, body } = COPY[reason] ?? COPY.download;
  const next =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.pathname + window.location.search)
      : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
        <Lock className="mx-auto size-6 text-gold" />
        <h2 id="signin-title" className="mt-3 text-lg font-bold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={`/sign-up?next=${next}`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Create free account
          </Link>
          <Link
            href={`/log-in?next=${next}`}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-input px-4 text-sm font-medium"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
