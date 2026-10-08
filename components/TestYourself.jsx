"use client";
import { useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { SUBJECTS } from "@/lib/study-data";
import { createClient } from "@/utils/supabase/client";
import { useNotes } from "@/components/Noteprovider";
import { SignInPrompt } from "@/components/SignInPrompt";
import { guestLimitReached, recordGuestAiUse } from "@/lib/guestLimit";

const GRADES = [12, 11];
const FUNCTION_NAME = "ProTestYourSelf";

export function TestYourself() {
  const { isLoggedIn } = useNotes() ?? {};
  const [showSignIn, setShowSignIn] = useState(false);

  const [grade, setGrade] = useState(GRADES[0]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Guests get 3 free AI uses, then must sign in.
  function allowAiUse() {
    if (isLoggedIn) return true;
    if (guestLimitReached()) {
      setShowSignIn(true);
      return false;
    }
    recordGuestAiUse();
    return true;
  }

  async function generateQuestion() {
    if (generating || !allowAiUse()) return;
    setGenerating(true);
    setLoadError(null);
    setResult(null);
    setAnswer("");
    setQuestion(null);
    try {
      const supabase = createClient();
      // Edge function replies: { question: "..." }
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: "generate_question", grade, subject },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.question) throw new Error("No question came back");
      setQuestion(data.question);
    } catch (err) {
      console.error(err);
      setLoadError("Couldn't generate a question just now. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function checkAnswer() {
    const value = answer.trim();
    if (!value || !question || checking) return;
    if (!allowAiUse()) return;
    setChecking(true);
    setLoadError(null);
    try {
      const supabase = createClient();
      // Edge function replies: { correct: boolean|null, feedback, correctAnswer }
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: "check_answer", grade, subject, question, answer: value },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({
        correct: typeof data?.correct === "boolean" ? data.correct : null,
        feedback: data?.feedback ?? "",
        correctAnswer: data?.correctAnswer ?? null,
      });
    } catch (err) {
      console.error(err);
      setLoadError("Couldn't check your answer just now. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6">
      <SignInPrompt open={showSignIn} reason="ai" onClose={() => setShowSignIn(false)} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Grade</p>
          <div className="mt-2 flex gap-2">
            {GRADES.map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${grade === g ? "border-primary bg-brand-soft text-primary" : "border-border text-muted-foreground"}`}
              >
                Grade {g}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</p>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            {SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={generateQuestion}
        disabled={generating}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {generating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        {question ? "New question" : "Generate a question"}
      </button>

      {loadError && <p className="mt-3 text-sm text-destructive">{loadError}</p>}

      {question && (
        <div className="mt-5 space-y-4 border-t border-border pt-5">
          <p className="whitespace-pre-line break-words text-sm font-medium">{question}</p>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            disabled={checking}
            placeholder="Write your answer here…"
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-3 text-sm disabled:opacity-60"
          />

          <button
            onClick={checkAnswer}
            disabled={checking || !answer.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-secondary px-4 text-sm font-medium text-secondary-foreground disabled:opacity-60"
          >
            {checking && <Loader2 className="size-4 animate-spin" />}
            Check my answer
          </button>

          {result && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                result.correct === true
                  ? "border-success/40 bg-success/10"
                  : result.correct === false
                  ? "border-destructive/40 bg-destructive/10"
                  : "border-border bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {result.correct === true && <CheckCircle2 className="size-4 text-success" />}
                {result.correct === false && <XCircle className="size-4 text-destructive" />}
                {result.correct === true ? "Correct!" : result.correct === false ? "Not quite" : "Feedback"}
              </div>
              {result.feedback && (
                <p className="mt-2 whitespace-pre-line break-words text-muted-foreground">{result.feedback}</p>
              )}
              {result.correct === false && result.correctAnswer && (
                <p className="mt-2 break-words">
                  <span className="font-medium">Model answer: </span>
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
