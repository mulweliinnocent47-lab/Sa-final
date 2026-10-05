import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Download, FileText, Lock, MessageSquareText, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FREE_DOWNLOAD_LIMIT, FREE_SUBJECTS, NSC_START, PAPERS, daysUntil } from "@/lib/study-data";
import { getNotes } from "@/lib/notesHelper.js";

export const metadata = {
  title: "SA Study — NSC past papers, notes & AI practice",
  description: "Track your exam countdown, open NSC past papers and notes, and brainstorm with an AI study partner built for South African high schoolers.",
};

export default async function Dashboard() {
  const days = daysUntil(NSC_START);
  const downloadsUsed = 3;
  const recent = PAPERS.slice(0, 3);
  const NOTES = await getNotes();
  if (!NOTES) {
    return <h1>loading please wait...</h1>;
  }
  return (
    <AppShell>
      <section className="overflow-hidden rounded-3xl bg-hero p-6 text-primary-foreground shadow-float md:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
          <CalendarDays className="size-3.5" /> NSC finals · 19 Oct 2026
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">Matric finals in {days} days</h1>
        <p className="mt-3 max-w-xl text-sm text-primary-foreground/85 md:text-base">
          That's roughly {Math.floor(days / 7)} weekends left. Start today with one paper, one set of notes, and ten minutes with your AI study partner.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/practice" className="inline-flex h-11 items-center gap-2 rounded-lg bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
            <MessageSquareText className="size-4" /> Brainstorm with Practice AI
          </Link>
          <Link href="/papers" className="inline-flex h-11 items-center gap-2 rounded-lg border border-primary-foreground/40 bg-transparent px-4 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/15">
            Browse papers <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold"><span className="flex items-center gap-2"><Download className="size-4 text-primary" /> Downloads this month</span><span className="text-muted-foreground">{downloadsUsed}/{FREE_DOWNLOAD_LIMIT}</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${(downloadsUsed/FREE_DOWNLOAD_LIMIT)*100}%`}} /></div>
          <p className="mt-3 text-xs text-muted-foreground">{FREE_DOWNLOAD_LIMIT - downloadsUsed} left on Free. Go (R49) makes it unlimited.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold"><Lock className="size-4 text-gold" /> What Free unlocks</div>
          <p className="mt-3 text-sm text-muted-foreground">{FREE_SUBJECTS.join(", ")} · papers up to 2023 only.</p>
          <p className="mt-2 text-xs text-muted-foreground">Everything else shows a lock in the browser, so you always know before you click.</p>
        </div>
        <div className="rounded-2xl border border-border bg-gold-soft p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-gold" /> Pro · R99</div>
          <p className="mt-3 text-sm text-muted-foreground">Every subject, every year, unlimited AI practice sessions and no ads.</p>
          <Link href="/settings" className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">See plans</Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between"><h2 className="text-lg font-bold tracking-tight">Pick up where you left off</h2><Link href="/papers" className="text-sm font-medium text-primary">All papers</Link></div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {recent.map((p) => <Link key={p.id} href="/papers" className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-soft"><FileText className="size-5 text-primary" /><p className="mt-3 font-semibold">{p.subject}</p><p className="text-xs text-muted-foreground">Grade {p.grade} · {p.year} · {p.session}</p></Link>)}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between"><h2 className="text-lg font-bold tracking-tight">Short notes for tonight</h2><Link href="/notes" className="text-sm font-medium text-primary">All notes</Link></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {NOTES.slice(0,2).map((n)=><Link key={n.slug} href={`/notes/${encodeURIComponent(n.slug)}`} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-soft"><BookOpen className="size-5 text-cyan" /><p className="mt-3 font-semibold">{n.title}</p><p className="mt-1 text-sm text-muted-foreground">{n.summary}</p><p className="mt-3 text-xs text-muted-foreground">{n.minutes} min read</p></Link>)}
        </div>
      </section>
    </AppShell>
  );
}
