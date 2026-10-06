import { redirect } from "next/navigation";
import { getCounter, QUIZ_DONE_KEY, VISITS_KEY } from "@/lib/analytics";
import { getIndividualLeaderboard } from "@/lib/leaderboard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function countBy<T extends string>(values: T[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value || "Unknown", (counts.get(value || "Unknown") ?? 0) + 1);
  }

  return Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count
  );
}

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.app_metadata?.role || user.user_metadata?.role;

  if (role !== "admin") {
    redirect("/dashboard");
  }

  const admin = createSupabaseAdminClient();
  const [
    visits,
    quizDone,
    signedIn,
    referred,
    submitted,
    profiles,
    topReferrers,
    fraudFlags
  ] = await Promise.all([
    getCounter(VISITS_KEY),
    getCounter(QUIZ_DONE_KEY),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("referrals").select("id", { count: "exact", head: true }).eq("counted", true),
    admin.from("submissions").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("college, source_utm"),
    getIndividualLeaderboard(10),
    admin
      .from("fraud_flags")
      .select("id, user_id, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
  ]);

  const byUtm = countBy(
    (profiles.data ?? []).map((profile) => {
      const source = profile.source_utm as { utm_source?: string | null } | null;
      return source?.utm_source || "direct";
    })
  );
  const byCollege = countBy((profiles.data ?? []).map((profile) => profile.college || "Unknown"));
  const funnel = [
    { label: "Visits", value: visits },
    { label: "Quiz done", value: quizDone },
    { label: "Signed in", value: signedIn.count ?? 0 },
    { label: "Referred", value: referred.count ?? 0 },
    { label: "Submitted", value: submitted.count ?? 0 }
  ];

  return (
    <main className="min-h-dvh bg-[#f7faf8] px-5 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header>
          <p className="text-sm font-semibold text-coral">Admin</p>
          <h1 className="text-3xl font-bold text-ink">Workshop funnel</h1>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {funnel.map((item) => (
            <div key={item.label} className="rounded-md border border-neutral-200 bg-white p-4">
              <p className="text-sm text-neutral-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-ink">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <AdminList title="Registrations by UTM" rows={byUtm} />
          <AdminList title="Registrations by college" rows={byCollege} />
          <div className="rounded-md border border-neutral-200 bg-white p-4">
            <h2 className="font-bold text-ink">Top referrers</h2>
            <div className="mt-3 space-y-2">
              {topReferrers.map((entry) => (
                <div key={entry.id} className="flex justify-between gap-3 text-sm">
                  <span className="truncate text-neutral-700">{entry.name}</span>
                  <span className="font-bold text-ink">{entry.score}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-md border border-neutral-200 bg-white p-4">
          <h2 className="font-bold text-ink">Fraud flags</h2>
          <div className="mt-3 space-y-2">
            {(fraudFlags.data ?? []).map((flag) => (
              <div key={flag.id} className="rounded-md bg-neutral-50 p-3 text-sm">
                <p className="font-semibold text-ink">{flag.reason}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {flag.user_id} · {new Date(flag.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {(fraudFlags.data ?? []).length === 0 ? (
              <p className="text-sm text-neutral-600">No fraud flags yet.</p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminList({
  title,
  rows
}: {
  title: string;
  rows: Array<{ label: string; count: number }>;
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4">
      <h2 className="font-bold text-ink">{title}</h2>
      <div className="mt-3 space-y-2">
        {rows.slice(0, 10).map((row) => (
          <div key={row.label} className="flex justify-between gap-3 text-sm">
            <span className="truncate text-neutral-700">{row.label}</span>
            <span className="font-bold text-ink">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
