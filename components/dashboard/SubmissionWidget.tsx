"use client";

import { useEffect, useState } from "react";
import type { SubmissionScore } from "@/lib/submissions";

type SubmissionRecord = {
  id: string;
  url: string;
  status: "pending" | "processing" | "completed" | "failed";
  score: SubmissionScore | null;
  created_at: string;
};

export function SubmissionWidget({
  initialSubmissions
}: {
  initialSubmissions: SubmissionRecord[];
}) {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>(initialSubmissions);
  const [projectUrl, setProjectUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePollId, setActivePollId] = useState<string | null>(null);

  // Auto-start polling if there's any active pending/processing submission
  useEffect(() => {
    const pendingItem = submissions.find(
      (s) => s.status === "pending" || s.status === "processing"
    );
    if (pendingItem && !activePollId) {
      setActivePollId(pendingItem.id);
    }
  }, [submissions, activePollId]);

  // Polling loop every 3 seconds
  useEffect(() => {
    if (!activePollId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/submissions/${activePollId}`);
        if (!res.ok) return;

        const data: SubmissionRecord = await res.json();
        setSubmissions((prev) =>
          prev.map((item) => (item.id === data.id ? data : item))
        );

        if (data.status === "completed" || data.status === "failed") {
          setActivePollId(null);
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activePollId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectUrl.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: projectUrl.trim() })
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setError(data.error || "Submission failed. Check your URL.");
        return;
      }

      // Add to list immediately with 202 pending status
      const newSubmission: SubmissionRecord = {
        id: data.submission_id,
        url: projectUrl.trim(),
        status: "pending",
        score: null,
        created_at: new Date().toISOString()
      };

      setSubmissions((prev) => [newSubmission, ...prev]);
      setProjectUrl("");
      setActivePollId(data.submission_id);
    } catch {
      setSubmitting(false);
      setError("Network error submitting project.");
    }
  }

  return (
    <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">
          AI Project Evaluation
        </p>
        <h2 className="text-xl font-bold text-ink">Submit Your Workshop Project</h2>
        <p className="mt-1 text-xs text-neutral-600">
          Paste your GitHub repository or live deployment link to receive immediate AI evaluation & score.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error ? (
          <p className="rounded bg-red-50 p-2.5 text-xs font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2">
          <input
            type="url"
            required
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            placeholder="https://github.com/your-username/my-ai-project"
            className="flex-1 rounded-md border border-neutral-300 px-3.5 py-2 text-xs text-ink placeholder:text-neutral-400 focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-ink px-4 py-2 text-xs font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Project"}
          </button>
        </div>
      </form>

      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
          Your Submissions
        </h3>

        {submissions.length === 0 ? (
          <p className="py-4 text-center text-xs text-neutral-500">
            No submissions yet. Submit your project URL above to start AI evaluation.
          </p>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-md border border-neutral-200 p-4 space-y-3 bg-neutral-50/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={sub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-ink hover:underline truncate max-w-[240px]"
                  >
                    {sub.url}
                  </a>

                  {sub.status === "pending" || sub.status === "processing" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 animate-pulse">
                      <span className="size-1.5 rounded-full bg-amber-600"></span>
                      AI Evaluating (Polling 3s)...
                    </span>
                  ) : sub.status === "completed" && sub.score ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      Score: {sub.score.works.score + sub.score.meaningful_ai_use.score + sub.score.clarity.score + sub.score.originality.score}/20
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800">
                      Evaluation Failed
                    </span>
                  )}
                </div>

                {sub.score ? (
                  <div className="space-y-3 pt-1 border-t border-neutral-200 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-white p-2 rounded border border-neutral-200">
                        <span className="text-neutral-500">Works:</span>{" "}
                        <span className="font-bold text-ink">{sub.score.works.score}/5</span>
                        <p className="mt-1 text-neutral-600 line-clamp-2" title={sub.score.works.reason}>{sub.score.works.reason}</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-neutral-200">
                        <span className="text-neutral-500">Meaningful AI Use:</span>{" "}
                        <span className="font-bold text-ink">{sub.score.meaningful_ai_use.score}/5</span>
                        <p className="mt-1 text-neutral-600 line-clamp-2" title={sub.score.meaningful_ai_use.reason}>{sub.score.meaningful_ai_use.reason}</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-neutral-200">
                        <span className="text-neutral-500">Clarity:</span>{" "}
                        <span className="font-bold text-ink">{sub.score.clarity.score}/5</span>
                        <p className="mt-1 text-neutral-600 line-clamp-2" title={sub.score.clarity.reason}>{sub.score.clarity.reason}</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-neutral-200">
                        <span className="text-neutral-500">Originality:</span>{" "}
                        <span className="font-bold text-ink">{sub.score.originality.score}/5</span>
                        <p className="mt-1 text-neutral-600 line-clamp-2" title={sub.score.originality.reason}>{sub.score.originality.reason}</p>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-neutral-600 mb-1">Feedback:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-neutral-700">
                        {sub.score.feedback.map((str, idx) => (
                          <li key={idx}>{str}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
