"use client";

import { useEffect, useState } from "react";

type SubmissionState = {
  id: string;
  status: string;
  score?: unknown;
};

export function SubmissionForm() {
  const [url, setUrl] = useState("");
  const [submission, setSubmission] = useState<SubmissionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!submission || submission.status === "done" || submission.status === "needs_review") {
      return;
    }

    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/submissions/${submission.id}`);
      const payload = await response.json();

      if (response.ok) {
        setSubmission({
          id: payload.submission.id,
          status: payload.submission.status,
          score: payload.submission.score
        });
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [submission]);

  async function submitProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });
    const payload = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not submit project.");
      return;
    }

    setSubmission({ id: payload.submission_id, status: "queued" });
  }

  return (
    <section className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
      <h1 className="text-2xl font-bold text-ink">Submit your project</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        Use an HTTPS GitHub or approved demo URL. The evaluator will check it in the background.
      </p>

      <form onSubmit={submitProject} className="mt-5 space-y-3">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          required
          placeholder="https://github.com/you/project"
          className="w-full rounded-md border border-neutral-300 px-3 py-3 text-base text-ink outline-none focus:border-ink"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-ink px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit for evaluation"}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}

      {submission ? (
        <div className="mt-5 rounded-md bg-neutral-50 p-3">
          <p className="text-sm font-bold text-ink">Status: {submission.status}</p>
          <p className="mt-1 break-all text-xs text-neutral-500">ID: {submission.id}</p>
          {submission.status === "done" ? (
            <a
              href={`/certificate/${submission.id}`}
              className="mt-3 inline-flex rounded-md bg-mint px-3 py-2 text-sm font-bold text-ink"
            >
              View badge
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
