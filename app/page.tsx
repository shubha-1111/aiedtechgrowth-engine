import Link from "next/link";
import { QuizFlow } from "@/components/quiz/QuizFlow";
import { incrementCounter, VISITS_KEY } from "@/lib/analytics";
import { getPublicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const workshopTitle = "Build Your First AI Project in 60 Minutes";

export default async function HomePage() {
  await incrementCounter(VISITS_KEY);

  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const env = getPublicEnv();
  const shareText = `Join NxtWave's free workshop: ${workshopTitle}. Build your first AI project and get a project idea matched to your interests.`;
  const shareUrl = env.NEXT_PUBLIC_SITE_URL;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(
    `NxtWave Workshop: ${workshopTitle}`
  )}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;

  return (
    <main className="min-h-dvh bg-[#f6f8f5] px-4 py-4 text-ink sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col gap-6">
        <nav className="flex items-center justify-between rounded-md border border-neutral-200 bg-white px-4 py-3 shadow-sm">
          <Link href="/" className="text-sm font-bold text-ink">
            NxtWave Growth Engine
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
          >
            Dashboard
          </Link>
        </nav>

        <div className="grid flex-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="space-y-6 py-2 lg:py-8">
            <div className="inline-flex rounded-md border border-coral/30 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-coral shadow-sm">
              Free AI workshop
            </div>
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
                {workshopTitle}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-neutral-700 sm:text-lg">
                Answer five quick prompts and get a practical project idea, build outline,
                and referral link for the workshop.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                  Step 1
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">Find a project idea</p>
              </div>
              <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                  Step 2
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">Unlock the full outline</p>
              </div>
              <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                  Step 3
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">Share your referral link</p>
              </div>
            </div>

            <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-ink">Invite classmates</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Share the workshop and earn referral brownie points after sign-in.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-[#25D366] px-4 py-3 text-sm font-bold text-ink shadow-sm transition hover:brightness-95"
              >
                Share on WhatsApp
              </a>
              <a
                href={emailUrl}
                className="rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm font-bold text-ink shadow-sm transition hover:border-neutral-500"
              >
                Share by email
              </a>
              </div>
            </div>
          </section>

          <QuizFlow isSignedIn={Boolean(user)} />
        </div>
      </div>
    </main>
  );
}
