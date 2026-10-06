import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { LiveWorkshopPanel } from "@/components/workshop/LiveWorkshopPanel";
import {
  getCollegeLeaderboard,
  getIndividualLeaderboard,
  getMyReferralCount
} from "@/lib/leaderboard";
import { getPublicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const WORKSHOP_TITLE = "Build Your First AI Project in 60 Minutes";
const WORKSHOP_START = "20261012T123000Z";
const WORKSHOP_END = "20261012T133000Z";

export const dynamic = "force-dynamic";

function buildCalendarUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `NxtWave Workshop: ${WORKSHOP_TITLE}`,
    dates: `${WORKSHOP_START}/${WORKSHOP_END}`,
    details:
      "Join the free NxtWave workshop and build your first AI project in 60 minutes.",
    location: "Online"
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, college, branch, year, ref_code")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/profile");
  }

  const env = getPublicEnv();
  const referralUrl = `${env.NEXT_PUBLIC_SITE_URL}/?ref=${encodeURIComponent(
    profile.ref_code
  )}&utm_source=student_referral`;
  const shareText = `Join me for NxtWave's free workshop "${WORKSHOP_TITLE}". Register here: ${referralUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const whatsappReminderUrl = `https://wa.me/?text=${encodeURIComponent(
    `Please remind me about NxtWave's free workshop "${WORKSHOP_TITLE}".`
  )}`;
  const displayName = profile.name || user.email || "Builder";
  const [myReferralCount, individualLeaderboard, collegeLeaderboard] = await Promise.all([
    getMyReferralCount(user.id),
    getIndividualLeaderboard(10),
    getCollegeLeaderboard(10)
  ]);

  return (
    <main className="min-h-dvh bg-[#f7faf8] px-5 py-5">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-coral">Referral hub</p>
            <h1 className="text-2xl font-bold leading-tight text-ink">Welcome, {displayName}</h1>
            <p className="mt-1 text-sm text-neutral-600">
              {profile.college} · {profile.branch} · Year {profile.year}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-neutral-100"
            >
              Sign out
            </button>
          </form>
        </header>

        <section className="grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-neutral-500">My referral link</p>
            <p className="mt-3 break-all rounded-md bg-neutral-50 p-3 text-sm font-semibold leading-6 text-ink">
              {referralUrl}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-[#25D366] px-4 py-3 text-center text-sm font-bold text-ink"
              >
                Share on WhatsApp
              </a>
              <a
                href={buildCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-neutral-300 px-4 py-3 text-center text-sm font-bold text-ink"
              >
                Add to Google Calendar
              </a>
            </div>
            <a
              href={whatsappReminderUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-neutral-300 px-4 py-3 text-sm font-bold text-ink"
            >
              Remind me on WhatsApp
            </a>
            <a
              href="/submit"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-ink px-4 py-3 text-sm font-bold text-white"
            >
              Submit project
            </a>
          </div>

          <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-neutral-500">My referral count</p>
            <p className="mt-3 text-5xl font-bold text-ink">{myReferralCount}</p>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Referrals count after sign-in and profile verification.
            </p>
          </div>
        </section>

        <LiveWorkshopPanel userId={user.id} />

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Individual leaderboard</h2>
              <span className="text-xs font-semibold text-neutral-500">Top 10</span>
            </div>
            {individualLeaderboard.length > 0 ? (
              <ol className="space-y-3">
                {individualLeaderboard.map((entry, index) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-md bg-neutral-50 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{entry.name}</p>
                        <p className="truncate text-xs text-neutral-500">{entry.college}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-ink">{entry.score}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-md bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">
                No referral scores yet. Share your link to start the board.
              </p>
            )}
          </div>

          <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">College leaderboard</h2>
              <span className="text-xs font-semibold text-neutral-500">Top 10</span>
            </div>
            {collegeLeaderboard.length > 0 ? (
              <ol className="space-y-3">
                {collegeLeaderboard.map((entry, index) => (
                  <li
                    key={entry.college}
                    className="flex items-center justify-between gap-3 rounded-md bg-neutral-50 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-mint text-sm font-bold text-ink">
                        {index + 1}
                      </span>
                      <p className="truncate text-sm font-bold text-ink">{entry.college}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-ink">{entry.score}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-md bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">
                College scores appear after verified referrals are counted.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
