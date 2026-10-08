"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { SUBJECTS } from "@/lib/study-data";
import { createClient } from "@/utils/supabase/client";
import { useNotes } from "@/components/Noteprovider";
import { SignInPrompt } from "@/components/SignInPrompt";
import {
  guestLimitReached,
  recordGuestAiUse,
} from "@/lib/guestLimit";

const GRADES = [12, 11];
const FUNCTION_NAME = "ProTestYourSelf";
const TRY_AGAIN =
  "Something went wrong. Please try again later.";

const isText = (value) =>
  typeof value === "string" &&
  value.trim().length > 0;

/**
 * Make sure data is an object.
 *
 * Normally Supabase gives us an object because
 * ProTestYourSelf returns application/json.
 */
function normalizeData(data) {
  if (!data) {
    return null;
  }

  if (typeof data === "object") {
    return data;
  }

  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  return null;
}

export function TestYourself() {
  const { isLoggedIn } = useNotes() ?? {};

  const [showSignIn, setShowSignIn] =
    useState(false);

  const [grade, setGrade] = useState(GRADES[0]);

  const [subject, setSubject] =
    useState(SUBJECTS[0]);

  const [question, setQuestion] =
    useState(null);

  const [answer, setAnswer] = useState("");

  const [generating, setGenerating] =
    useState(false);

  const [checking, setChecking] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const [loadError, setLoadError] =
    useState(null);

  // ---------------------------------------------
  // Guest AI limit
  // ---------------------------------------------
  function canUseAi() {
    if (isLoggedIn || !guestLimitReached()) {
      return true;
    }

    setShowSignIn(true);
    return false;
  }

  function countUse() {
    if (!isLoggedIn) {
      recordGuestAiUse();
    }
  }

  // ---------------------------------------------
  // Generate question
  // ---------------------------------------------
  async function generateQuestion() {
    if (generating) {
      return;
    }

    if (!canUseAi()) {
      return;
    }

    setGenerating(true);
    setLoadError(null);
    setResult(null);
    setAnswer("");
    setQuestion(null);

    try {
      const supabase = createClient();

      const {
        data: rawData,
        error,
      } = await supabase.functions.invoke(
        FUNCTION_NAME,
        {
          body: {
            action: "generate_question",
            grade,
            subject,
          },
        }
      );

      console.log(
        "ProTestYourSelf generate response:",
        rawData
      );

      if (error) {
        console.error(
          "Supabase function error:",
          error
        );
        throw error;
      }

      const data = normalizeData(rawData);

      if (!isText(data?.question)) {
        console.error(
          "Unexpected generate response:",
          rawData
        );

        throw new Error(
          "Unexpected response from AI"
        );
      }

      setQuestion(data.question.trim());

      countUse();
    } catch (error) {
      console.error(
        "Generate question error:",
        error
      );

      setLoadError(TRY_AGAIN);
    } finally {
      setGenerating(false);
    }
  }

  // ---------------------------------------------
  // Check answer
  // ---------------------------------------------
  async function checkAnswer() {
    const value = answer.trim();

    if (!value) {
      return;
    }

    if (!question) {
      return;
    }

    if (checking) {
      return;
    }

    if (!canUseAi()) {
      return;
    }

    setChecking(true);
    setLoadError(null);

    try {
      const supabase = createClient();

      const {
        data: rawData,
        error,
      } = await supabase.functions.invoke(
        FUNCTION_NAME,
        {
          body: {
            action: "check_answer",
            grade,
            subject,
            question,
            answer: value,
          },
        }
      );

      console.log(
        "ProTestYourSelf check response:",
        rawData
      );

      if (error) {
        console.error(
          "Supabase function error:",
          error
        );

        throw error;
      }

      const data = normalizeData(rawData);

      if (
        typeof data?.correct !== "boolean" ||
        !isText(data?.feedback) ||
        !isText(data?.correctAnswer)
      ) {
        console.error(
          "Unexpected check response:",
          rawData
        );

        throw new Error(
          "Unexpected response from AI"
        );
      }

      setResult({
        correct: data.correct,
        feedback: data.feedback.trim(),
        correctAnswer:
          data.correctAnswer.trim(),
      });

      countUse();
    } catch (error) {
      console.error(
        "Check answer error:",
        error
      );

      setLoadError(TRY_AGAIN);
    } finally {
      setChecking(false);
    }
  }

  // ---------------------------------------------
  // UI
  // ---------------------------------------------
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6">
      <SignInPrompt
        open={showSignIn}
        reason="ai"
        onClose={() => setShowSignIn(false)}
      />

      {/* Grade + Subject */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Grade
          </p>

          <div className="mt-2 flex gap-2">
            {GRADES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  grade === g
                    ? "border-primary bg-brand-soft text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                Grade {g}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Subject
          </p>

          <select
            value={subject}
            onChange={(e) =>
              setSubject(e.target.value)
            }
            className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate */}
      <button
        type="button"
        onClick={generateQuestion}
        disabled={generating}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {generating ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}

        {question
          ? "New question"
          : "Generate a question"}
      </button>

      {/* Error */}
      {loadError && (
        <p className="mt-3 text-sm text-destructive">
          {loadError}
        </p>
      )}

      {/* Question */}
      {question && (
        <div className="mt-5 space-y-4 border-t border-border pt-5">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="whitespace-pre-line break-words text-sm font-medium">
              {question}
            </p>
          </div>

          {/* Answer */}
          <textarea
            value={answer}
            onChange={(e) =>
              setAnswer(e.target.value)
            }
            rows={4}
            disabled={checking}
            placeholder="Write your answer here…"
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-3 text-sm disabled:opacity-60"
          />

          {/* Check */}
          <button
            type="button"
            onClick={checkAnswer}
            disabled={
              checking || !answer.trim()
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-secondary px-4 text-sm font-medium text-secondary-foreground disabled:opacity-60"
          >
            {checking && (
              <Loader2 className="size-4 animate-spin" />
            )}

            Check my answer
          </button>

          {/* Result */}
          {result && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                result.correct
                  ? "border-success/40 bg-success/10"
                  : "border-destructive/40 bg-destructive/10"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {result.correct ? (
                  <CheckCircle2 className="size-4 text-success" />
                ) : (
                  <XCircle className="size-4 text-destructive" />
                )}

                {result.correct
                  ? "Correct!"
                  : "Not quite"}
              </div>

              <p className="mt-2 whitespace-pre-line break-words text-muted-foreground">
                {result.feedback}
              </p>

              {!result.correct && (
                <p className="mt-2 break-words">
                  <span className="font-medium">
                    Model answer:
                  </span>{" "}
                  {result.correctAnswer}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
  }
