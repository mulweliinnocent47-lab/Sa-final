"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Lock, Search } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { NotesUrlReader } from "@/components/NotesUrlReader";
import { useNotes } from "@/components/Noteprovider";
import Loading from "@/components/Loading.jsx";

/*
|--------------------------------------------------------------------------
| Normalize text
|--------------------------------------------------------------------------
| Makes searches more flexible:
| - lowercase
| - removes accents
| - treats -, _, / and punctuation as spaces
| - removes extra spaces
|
| Examples:
| "Grade-7"     -> "grade 7"
| "Life_Notes"  -> "life notes"
| "GEOGRAPHY!"  -> "geography"
|--------------------------------------------------------------------------
*/

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_/\\.,:;()[\]{}'"!?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
|--------------------------------------------------------------------------
| Levenshtein distance
|--------------------------------------------------------------------------
*/

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  // Keep b as the shorter string to reduce memory usage.
  if (a.length < b.length) {
    [a, b] = [b, a];
  }

  let previous = Array.from(
    { length: b.length + 1 },
    (_, i) => i
  );

  for (let i = 1; i <= a.length; i++) {
    const current = [i];

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }

    previous = current;
  }

  return previous[b.length];
}

/*
|--------------------------------------------------------------------------
| Compare two words
|--------------------------------------------------------------------------
*/

function wordSimilarity(a, b) {
  if (!a || !b) return 0;

  if (a === b) {
    return 1;
  }

  /*
   * Partial matches
   *
   * math -> mathematics
   * geo  -> geography
   */
  if (a.includes(b) || b.includes(a)) {
    const shorter = Math.min(a.length, b.length);
    const longer = Math.max(a.length, b.length);

    return shorter / longer;
  }

  /*
   * Don't fuzzy-match tiny words.
   */
  if (a.length <= 2 || b.length <= 2) {
    return 0;
  }

  const distance = levenshtein(a, b);
  const maxLength = Math.max(a.length, b.length);

  return 1 - distance / maxLength;
}

/*
|--------------------------------------------------------------------------
| Search notes
|--------------------------------------------------------------------------
|
| Searches through:
|
| title
| subject
| folder
| grade
| summary
| slug
| storagePath
|
| Supports:
|
| exact matches
| partial matches
| multiple words
| spelling mistakes
| grade searches
| folder searches
| subject searches
|--------------------------------------------------------------------------
*/

function searchNotes(notes, query) {
  const search = normalize(query);

  /*
   * Nothing searched -> show everything
   */
  if (!search) {
    return notes;
  }

  const queryWords = search
    .split(" ")
    .filter(Boolean);

  return notes
    .map((note) => {
      /*
       * Everything that can be searched.
       */
      const fields = [
        {
          name: "title",
          value: normalize(note.title),
          weight: 100,
        },

        {
          name: "subject",
          value: normalize(note.subject),
          weight: 90,
        },

        {
          name: "folder",
          value: normalize(note.folder),
          weight: 85,
        },

        {
          name: "grade",
          value: normalize(
            `grade ${note.grade} grade-${note.grade} ${note.grade}`
          ),
          weight: 80,
        },

        {
          name: "summary",
          value: normalize(note.summary),
          weight: 40,
        },

        {
          name: "slug",
          value: normalize(note.slug),
          weight: 75,
        },

        {
          name: "storagePath",
          value: normalize(note.storagePath),
          weight: 70,
        },
      ];

      let score = 0;
      let matchedWords = 0;

      /*
       * Search the complete query in every field.
       */
      for (const field of fields) {
        if (!field.value) {
          continue;
        }

        /*
         * Exact field match
         *
         * Searching:
         * "geography"
         *
         * subject:
         * "geography"
         */
        if (field.value === search) {
          score += field.weight * 2;
          continue;
        }

        /*
         * Entire query exists inside field.
         *
         * "weather climate"
         * can match a title containing it.
         */
        if (field.value.includes(search)) {
          score += field.weight;
        }

        /*
         * Split field into words.
         */
        const fieldWords = field.value.split(" ");

        /*
         * Compare every query word.
         */
        for (const queryWord of queryWords) {
          let bestMatch = 0;

          for (const fieldWord of fieldWords) {
            if (!fieldWord) {
              continue;
            }

            /*
             * Exact word.
             */
            if (fieldWord === queryWord) {
              bestMatch = 1;
              break;
            }

            /*
             * Partial word.
             *
             * math -> mathematics
             * geo  -> geography
             */
            if (
              fieldWord.includes(queryWord) ||
              queryWord.includes(fieldWord)
            ) {
              const ratio =
                Math.min(
                  fieldWord.length,
                  queryWord.length
                ) /
                Math.max(
                  fieldWord.length,
                  queryWord.length
                );

              bestMatch = Math.max(
                bestMatch,
                ratio * 0.9
              );

              continue;
            }

            /*
             * Fuzzy spelling match.
             *
             * geograpy -> geography
             * mathemetics -> mathematics
             */
            const similarity = wordSimilarity(
              queryWord,
              fieldWord
            );

            if (similarity >= 0.65) {
              bestMatch = Math.max(
                bestMatch,
                similarity * 0.75
              );
            }
          }

          /*
           * Add the best match for this query word.
           */
          if (bestMatch > 0) {
            score += field.weight * bestMatch;
            matchedWords++;
          }
        }
      }

      /*
       * Reward notes where ALL search words match.
       */
      if (matchedWords === queryWords.length) {
        score += 100;
      } else if (matchedWords > 0) {
        score += matchedWords * 10;
      }

      return {
        note,
        score,
        matchedWords,
      };
    })

    /*
     * Remove very weak matches.
     */
    .filter((item) => item.score > 10)

    /*
     * Sort by:
     *
     * 1. Number of matched words
     * 2. Relevance score
     */
    .sort((a, b) => {
      if (b.matchedWords !== a.matchedWords) {
        return b.matchedWords - a.matchedWords;
      }

      return b.score - a.score;
    })

    /*
     * Return only notes.
     */
    .map((item) => item.note);
}

export default function NotesPage() {
  const { NOTES } = useNotes() ?? {};

  const [search, setSearch] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (!NOTES) {
    return <Loading />;
  }

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const filteredNotes = searchNotes(
    NOTES,
    search
  );

  return (
    <AppShell>
      {/* --------------------------------------------------------------- */}
      {/* Header                                                          */}
      {/* --------------------------------------------------------------- */}

      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Notes
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Every note is a plain{" "}
        <code className="rounded bg-muted px-1">
          .txt
        </code>{" "}
        source, rendered with markdown formatting.
        Paste any text URL to read it the same way.
      </p>

      {/* --------------------------------------------------------------- */}
      {/* Search                                                          */}
      {/* --------------------------------------------------------------- */}

      <div className="mt-5">
        <div className="relative">
          <Search
            className="
              absolute
              left-3
              top-1/2
              size-4
              -translate-y-1/2
              text-muted-foreground
            "
          />

          <input
            type="search"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search notes, subjects, grades..."
            className="
              h-11
              w-full
              rounded-lg
              border
              border-input
              bg-background
              pl-10
              pr-3
              text-sm
              outline-none
              transition
              focus:ring-2
              focus:ring-primary
            "
          />
        </div>

        {/* Search result count */}
        {search && (
          <p className="mt-2 text-xs text-muted-foreground">
            {filteredNotes.length}{" "}
            {filteredNotes.length === 1
              ? "note"
              : "notes"}{" "}
            found
          </p>
        )}
      </div>

      <NotesUrlReader />

      {/* --------------------------------------------------------------- */}
      {/* Notes                                                            */}
      {/* --------------------------------------------------------------- */}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {filteredNotes.map((n) => (
          <Link
            key={`${n.folder}-${n.slug}`}
            href={`/notes/${encodeURIComponent(n.slug)}`}
            className="
              rounded-2xl
              border
              border-border
              bg-card
              p-5
              shadow-sm
              transition-shadow
              hover:shadow-soft
            "
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <BookOpen className="size-5 text-cyan" />

              {n.proOnly && (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1
                    rounded-full
                    bg-gold-soft
                    px-2
                    py-1
                    text-xs
                    font-medium
                  "
                >
                  <Lock className="size-3" />

                  Pro
                </span>
              )}
            </div>

            {/* Title */}
            <p className="mt-3 font-semibold">
              {n.title}
            </p>

            {/* Summary */}
            <p className="mt-1 text-sm text-muted-foreground">
              {n.summary}
            </p>

            {/* Metadata */}
            <p className="mt-3 text-xs text-muted-foreground">
              {n.subject || "Unknown Subject"}{" "}
              · Grade {n.grade ?? "?"} ·{" "}
              {n.minutes ?? 1} min read
            </p>
          </Link>
        ))}

        {/* ------------------------------------------------------------- */}
        {/* No results                                                    */}
        {/* ------------------------------------------------------------- */}

        {filteredNotes.length === 0 && (
          <div
            className="
              col-span-full
              rounded-2xl
              border
              border-border
              bg-card
              p-8
              text-center
            "
          >
            <p className="font-medium">
              No notes found
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Try a different word or check your spelling.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}