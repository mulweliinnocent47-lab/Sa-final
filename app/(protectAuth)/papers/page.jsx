"use client";

import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import { DownloadButton } from "@/components/DownloadButton";
import { AppShell } from "@/components/AppShell";
import { useNotes } from "@/components/Noteprovider";
import Loading from "@/components/Loading.jsx";

export default function PapersPage() {
  const { PAPERS } = useNotes() ?? {};

  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");
  const [grade, setGrade] = useState("All");

  /*
   * --------------------------------------------------
   * SUBJECTS
   * Automatically get subjects from your real data
   * --------------------------------------------------
   */

  const subjects = useMemo(() => {
    if (!Array.isArray(PAPERS)) return [];

    return [
      ...new Set(
        PAPERS
          .map((paper) => paper.subject)
          .filter(Boolean)
      ),
    ].sort();
  }, [PAPERS]);

  /*
   * --------------------------------------------------
   * GRADES
   * Automatically get grades from your real data
   * --------------------------------------------------
   */

  const grades = useMemo(() => {
    if (!Array.isArray(PAPERS)) return [];

    return [
      ...new Set(
        PAPERS
          .map((paper) => String(paper.grade))
          .filter(Boolean)
      ),
    ].sort((a, b) => Number(a) - Number(b));
  }, [PAPERS]);

  /*
   * --------------------------------------------------
   * SEARCH + FILTER
   * --------------------------------------------------
   */

  const results = useMemo(() => {
    if (!Array.isArray(PAPERS)) return [];

    const search = query.trim().toLowerCase();

    return PAPERS.filter((paper) => {
      // Subject filter
      const matchesSubject =
        subject === "All" ||
        paper.subject === subject;

      // Grade filter
      const matchesGrade =
        grade === "All" ||
        String(paper.grade) === String(grade);

      // Search
      const searchableText = [
        paper.title,
        paper.subject,
        paper.grade,
        paper.year,
        paper.province,
        paper.session,
        paper.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search ||
        searchableText.includes(search);

      return (
        matchesSubject &&
        matchesGrade &&
        matchesSearch
      );
    });
  }, [PAPERS, query, subject, grade]);

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (!PAPERS) {
    return <Loading />;
  }

  return (
    <AppShell>
      {/* PAGE TITLE */}

      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Past papers
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Browse and download past papers from StudyHub.
      </p>

      {/* FILTER AREA */}

      <div className="sticky top-16 z-30 -mx-4 mt-5 bg-background/90 px-4 py-3 backdrop-blur">

        {/* SEARCH */}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subject, paper, year or province"
            className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        {/* SUBJECT SELECTOR */}

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {["All", ...subjects].map((s) => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                subject === s
                  ? "border-primary bg-brand-soft text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* GRADE SELECTOR */}

        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {["All", ...grades].map((g) => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                grade === g
                  ? "border-primary bg-brand-soft text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {g === "All"
                ? "All grades"
                : `Grade ${g}`}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS */}

      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {results.map((paper) => (
          <div
            key={paper.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            {/* TOP */}

            <div className="flex items-start justify-between gap-2">
              <FileText className="size-5 text-primary" />

              {paper.memo && (
                <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                  Memo included
                </span>
              )}
            </div>

            {/* SUBJECT */}

            <p className="mt-3 font-semibold">
              {paper.subject}
            </p>

            {/* PAPER INFORMATION */}

            <p className="text-xs text-muted-foreground">
              Grade {paper.grade}

              {paper.year && (
                <> · {paper.year}</>
              )}

              {paper.session && (
                <> · {paper.session}</>
              )}

              {paper.province && (
                <> · {paper.province}</>
              )}

              
            </p>

            {/* TITLE */}

            {paper.title && (
              <p className="mt-2 text-sm text-muted-foreground">
                {paper.title}
              </p>
            )}

            {/* DOWNLOAD */}

            {paper.url && (
              <DownloadButton
                href={`/api/download?path=${encodeURIComponent(
                  paper.path
                )}&filename=${encodeURIComponent(
                  `${paper.title || paper.name || "paper"}.pdf`
                )}`}
                className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
              />
            )}
          </div>
        ))}
      </div>

      {/* NO RESULTS */}

      {results.length === 0 && (
        <div className="py-16 text-center">
          <FileText className="mx-auto size-8 text-muted-foreground" />

          <p className="mt-3 text-sm text-muted-foreground">
            No papers match your search.
          </p>

          {(query || subject !== "All" || grade !== "All") && (
            <button
              onClick={() => {
                setQuery("");
                setSubject("All");
                setGrade("All");
              }}
              className="mt-4 rounded-lg border px-3 py-2 text-sm font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </AppShell>
  );
}