import Script from "next/script";
import { redirect } from "next/navigation";
import { createProfile } from "@/app/profile/actions";
import { getServerEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export default async function ProfilePage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();

  if (profile.data) {
    redirect("/dashboard");
  }

  const env = getServerEnv();

  if (!env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    throw new Error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is required for profile creation.");
  }

  return (
    <main className="min-h-dvh bg-white px-5 py-6">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col justify-center">
        <section className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-coral">
              One last step
            </p>
            <h1 className="text-3xl font-bold leading-tight text-ink">Complete your profile</h1>
            <p className="text-sm leading-6 text-neutral-700">
              This unlocks your referral link and confirms each signup is a real workshop
              registration.
            </p>
          </div>

          {searchParams?.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Could not save your profile. Please check the form and try again.
            </p>
          ) : null}

          <form action={createProfile} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">College</span>
              <input
                name="college"
                required
                minLength={2}
                maxLength={120}
                className="w-full rounded-md border border-neutral-300 px-3 py-3 text-base text-ink outline-none focus:border-ink"
                placeholder="Your engineering college"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">Branch</span>
              <input
                name="branch"
                required
                minLength={2}
                maxLength={80}
                className="w-full rounded-md border border-neutral-300 px-3 py-3 text-base text-ink outline-none focus:border-ink"
                placeholder="CSE, ECE, Mechanical..."
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">Year</span>
              <select
                name="year"
                required
                className="w-full rounded-md border border-neutral-300 px-3 py-3 text-base text-ink outline-none focus:border-ink"
                defaultValue="4"
              >
                <option value="1">1st year</option>
                <option value="2">2nd year</option>
                <option value="3">3rd year</option>
                <option value="4">Final year</option>
                <option value="5">Graduate</option>
              </select>
            </label>

            <label className="flex items-start gap-3 rounded-md border border-neutral-200 p-3">
              <input
                name="whatsapp_opt_in"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-ink"
              />
              <span className="text-sm leading-6 text-neutral-700">
                I agree to receive workshop updates and reminders on WhatsApp. I can opt out
                anytime.
              </span>
            </label>

            <div
              className="cf-turnstile"
              data-sitekey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              data-theme="light"
            />

            <button
              type="submit"
              className="w-full rounded-md bg-ink px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
            >
              Create my referral link
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
