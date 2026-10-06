"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const pollChoices = ["AI tools", "Web apps", "Automation"] as const;
const milestones = ["Joined live", "Built first screen", "Submitted project"] as const;

export function LiveWorkshopPanel({ userId }: { userId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const refreshVotes = useCallback(async () => {
    const { data } = await supabase.from("poll_votes").select("choice");
    const next: Record<string, number> = {};

    for (const row of data ?? []) {
      next[row.choice] = (next[row.choice] ?? 0) + 1;
    }

    setVotes(next);
  }, [supabase]);

  useEffect(() => {
    void refreshVotes();

    supabase
      .from("poll_votes")
      .select("choice")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => setSelected(data?.choice ?? null));

    supabase
      .from("milestone_progress")
      .select("milestone, completed")
      .eq("user_id", userId)
      .then(({ data }) => {
        setDone(
          Object.fromEntries((data ?? []).map((row) => [row.milestone, row.completed]))
        );
      });

    const channel = supabase
      .channel("live-poll")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes" },
        () => void refreshVotes()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshVotes, supabase, userId]);

  async function vote(choice: string) {
    setSelected(choice);
    await supabase.from("poll_votes").upsert(
      {
        user_id: userId,
        choice
      },
      { onConflict: "user_id" }
    );
    await refreshVotes();
  }

  async function toggleMilestone(milestone: string) {
    const completed = !done[milestone];
    setDone((current) => ({ ...current, [milestone]: completed }));
    await supabase.from("milestone_progress").upsert(
      {
        user_id: userId,
        milestone,
        completed,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id,milestone" }
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Live poll</h2>
        <p className="mt-1 text-sm text-neutral-600">What are you most excited to build?</p>
        <div className="mt-4 grid gap-2">
          {pollChoices.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => vote(choice)}
              className={`rounded-md border px-3 py-2 text-left text-sm font-bold ${
                selected === choice ? "border-ink bg-ink text-white" : "border-neutral-200"
              }`}
            >
              {choice} · {votes[choice] ?? 0}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Milestone tracker</h2>
        <div className="mt-4 space-y-2">
          {milestones.map((milestone) => (
            <label
              key={milestone}
              className="flex items-center gap-3 rounded-md border border-neutral-200 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={Boolean(done[milestone])}
                onChange={() => toggleMilestone(milestone)}
                className="size-4"
              />
              <span className="text-sm font-semibold text-ink">{milestone}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
