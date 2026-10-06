"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  branchLabels,
  branches,
  interestLabels,
  interests,
  skillLabels,
  skills,
  timeBracketLabels,
  timeBrackets,
  type QuizInput,
  type QuizResponse
} from "@/lib/quiz";

type FieldName = keyof QuizInput;

const questions: {
  field: FieldName;
  title: string;
  subtitle: string;
  options: readonly string[];
  labels: Record<string, string>;
}[] = [
  {
    field: "branch",
    title: "What is your branch?",
    subtitle: "This helps tune the project context.",
    options: branches,
    labels: branchLabels
  },
  {
    field: "skill",
    title: "How comfortable are you with building?",
    subtitle: "Pick the closest match. No free-text needed.",
    options: skills,
    labels: skillLabels
  },
  {
    field: "interest",
    title: "What kind of project sounds useful?",
    subtitle: "Choose one direction for your workshop idea.",
    options: interests,
    labels: interestLabels
  },
  {
    field: "time",
    title: "How much time can you spend after class?",
    subtitle: "The outline will stay realistic for your slot.",
    options: timeBrackets,
    labels: timeBracketLabels
  }
];

const initialAnswers: Partial<QuizInput> = {};

export function QuizFlow({ isSignedIn }: { isSignedIn: boolean }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizInput>>(initialAnswers);
  const [result, setResult] = useState<QuizResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = questions[step];
  const isComplete = questions.every((question) => answers[question.field]);
  const progress = useMemo(() => Math.min(step + 1, 5), [step]);
  const referralText =
    "Refer a friend after sign-in and earn extra brownie points on the workshop leaderboard.";

  function selectAnswer(field: FieldName, value: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [field]: value
    }));
  }

  async function submitQuiz() {
    if (!isComplete) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(answers)
    });

    const payload = await response.json().catch(() => ({
      error: "Could not generate your idea. Try again."
    }));
    setIsLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not generate your idea. Try again.");
      return;
    }

    setResult(payload);
  }

  if (result) {
    return (
      <section className="space-y-5 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">
            Your project idea
          </p>
          <h2 className="text-2xl font-bold leading-tight text-ink">{result.idea.title}</h2>
          <p className="text-sm leading-6 text-neutral-700">{result.idea.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {result.idea.tools.map((tool) => (
            <span
              key={tool}
              className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-700"
            >
              {tool}
            </span>
          ))}
        </div>

        <div className="rounded-md border border-mint bg-[#f0fff6] p-4">
          <p className="text-sm font-bold text-ink">Referral brownie points</p>
          <p className="mt-1 text-sm leading-6 text-neutral-700">{referralText}</p>
          <Link
            href={isSignedIn ? "/dashboard" : "/login"}
            className="mt-3 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-bold text-white"
          >
            Get my referral link
          </Link>
        </div>

        {isSignedIn ? (
          <div className="space-y-4 border-t border-neutral-200 pt-4">
            <div>
              <h3 className="text-sm font-bold text-ink">Build outline</h3>
              <ol className="mt-3 space-y-3">
                {result.idea.steps.map((item, index) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-neutral-700">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-mint text-xs font-bold text-ink">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-md bg-neutral-50 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                Resume angle
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                {result.idea.why_it_helps_resume}
              </p>
            </div>
            {result.idea.slug && (
              <div className="pt-2">
                <Link
                  href={`/templates/${result.idea.slug}`}
                  className="inline-flex w-full justify-center rounded-md bg-ink px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-neutral-800"
                >
                  View full template &amp; code
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4">
            <p className="text-sm font-semibold text-ink">Unlock the full outline</p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Sign in to view the step-by-step plan and resume angle.
            </p>
            <Link
              href="/login"
              className="mt-3 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-bold text-white"
            >
              Sign in to unlock
            </Link>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">
            AI project matcher
          </p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            Question {progress} of 5
          </p>
        </div>
        <div className="h-2 w-28 rounded-full bg-neutral-100">
          <div className="h-2 rounded-full bg-mint transition-all" style={{ width: `${(progress / 5) * 100}%` }} />
        </div>
      </div>

      {step < questions.length ? (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-ink">{current.title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{current.subtitle}</p>
          </div>

          <div className="grid gap-3">
            {current.options.map((option) => {
              const isSelected = answers[current.field] === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectAnswer(current.field, option)}
                  className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                    isSelected
                      ? "border-ink bg-ink text-white shadow-sm"
                      : "border-neutral-200 bg-white text-ink hover:border-neutral-400 hover:bg-neutral-50"
                  }`}
                >
                  {current.labels[option]}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-ink">Ready to generate?</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              We will match one workshop project idea to your selected track.
            </p>
          </div>
          <dl className="grid gap-3 text-sm">
            {questions.map((question) => (
              <div key={question.field} className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500">{question.title}</dt>
                <dd className="font-semibold text-ink">
                  {answers[question.field]
                    ? question.labels[answers[question.field] as string]
                    : "-"}
                </dd>
              </div>
            ))}
          </dl>
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          <div className="rounded-md bg-[#f0fff6] p-3">
            <p className="text-sm font-bold text-ink">Referral bonus</p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">{referralText}</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => setStep((currentStep) => Math.max(0, currentStep - 1))}
          disabled={step === 0 || isLoading}
          className="flex-1 rounded-md border border-neutral-300 px-4 py-3 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        {step < questions.length ? (
          <button
            type="button"
            onClick={() => setStep((currentStep) => currentStep + 1)}
            disabled={!answers[current.field] || isLoading}
            className="flex-1 rounded-md bg-ink px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={submitQuiz}
            disabled={!isComplete || isLoading}
            className="flex-1 rounded-md bg-mint px-4 py-3 text-sm font-bold text-ink shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "Generating..." : "Show idea"}
          </button>
        )}
      </div>
    </section>
  );
}
