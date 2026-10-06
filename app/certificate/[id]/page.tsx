import { notFound } from "next/navigation";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const paramsSchema = z.object({
  id: z.string().uuid()
});

function totalScore(score: Record<string, { score: number }>) {
  return ["works", "meaningful_ai_use", "clarity", "originality"].reduce(
    (sum, key) => sum + Number(score[key]?.score ?? 0),
    0
  );
}

export default async function CertificatePage({ params }: { params: { id: string } }) {
  const parsed = paramsSchema.safeParse(params);

  if (!parsed.success) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("submissions")
    .select("id, url, score, profiles!submissions_user_id_fkey(name, college)")
    .eq("id", parsed.data.id)
    .eq("status", "done")
    .maybeSingle();

  if (!data || !data.score) {
    notFound();
  }

  const score = data.score as Record<string, { score: number; reason: string }>;
  const total = totalScore(score);
  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

  return (
    <main className="min-h-dvh bg-[#f7faf8] px-5 py-6">
      <section className="mx-auto max-w-2xl rounded-md border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-coral">
          NxtWave workshop badge
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-ink">
          AI Project Builder
        </h1>
        <p className="mt-3 text-base leading-7 text-neutral-700">
          Awarded to {profile?.name || "a student"} from {profile?.college || "their college"} for
          submitting a scored project in the free workshop.
        </p>
        <div className="mt-6 rounded-md bg-mint p-5 text-ink">
          <p className="text-sm font-bold">Score</p>
          <p className="mt-1 text-5xl font-bold">{total}/20</p>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {Object.entries(score)
            .filter(([, value]) => typeof value === "object" && "score" in value)
            .map(([key, value]) => (
              <div key={key} className="rounded-md border border-neutral-200 p-3">
                <dt className="text-sm font-bold capitalize text-ink">
                  {key.replaceAll("_", " ")}
                </dt>
                <dd className="mt-1 text-sm text-neutral-600">
                  {value.score}/5 · {value.reason}
                </dd>
              </div>
            ))}
        </dl>
        <a
          href={data.url}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex rounded-md bg-ink px-4 py-3 text-sm font-bold text-white"
        >
          View project
        </a>
      </section>
    </main>
  );
}
