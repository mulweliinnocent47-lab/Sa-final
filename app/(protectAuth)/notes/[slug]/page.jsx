import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TxtReader } from "@/components/TxtReader";
import { DownloadButton } from "@/components/DownloadButton";
import { getNote } from "@/lib/notesHelper";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await Promise.resolve(params);
  const note = await getNote(slug);

  if (!note) {
    return { title: "Note unavailable — StudyHub SA" };
  }

  return {
    title: `${note.title} — StudyHub SA notes`,
    description: note.summary,
  };
}

export default async function NoteDetailPage({ params }) {
  const { slug } = await Promise.resolve(params);
  const note = await getNote(slug);

  if (!note) {
    notFound();
  }

  return (
    <AppShell>
      <Link
        href="/notes"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All notes
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {note.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {note.subject} · Grade {note.grade} · {note.minutes} min read
        </p>
        {!note.proOnly && (
          <DownloadButton
            href={`${note.src}?download=1`}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm font-medium hover:bg-muted"
          >
            Download .txt
          </DownloadButton>
        )}
      </header>

      {note.proOnly ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-gold-soft p-8 text-center">
          <Lock className="mx-auto size-6 text-gold" />
          <h2 className="mt-3 text-lg font-bold">This note is part of Pro</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Pro opens every subject&apos;s notes, unlimited downloads and unlimited AI practice.
          </p>
          <Link
            href="/settings"
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            See plans
          </Link>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-8">
          <TxtReader src={note.src} />
        </div>
      )}
    </AppShell>
  );
}
