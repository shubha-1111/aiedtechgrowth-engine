import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginButton } from "./components/LoginButton";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    redirect(profile.data ? "/dashboard" : "/profile");
  }

  return (
    <main className="min-h-dvh bg-[#f7faf8] px-5 py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col justify-between gap-10">
        <Link href="/" className="text-sm font-bold text-ink">
          NxtWave Growth Engine
        </Link>

        <section className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-coral">
              Free workshop
            </p>
            <h1 className="text-4xl font-bold leading-tight text-ink">
              Build Your First AI Project in 60 Minutes
            </h1>
            <p className="text-base leading-7 text-neutral-700">
              Sign in to track referrals, view your workshop dashboard, and submit
              your project.
            </p>
          </div>

          {searchParams?.error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Google login could not be completed. Please try again.
            </p>
          ) : null}

          <div className="mt-6">
            <LoginButton />
          </div>
        </section>

        <p className="text-xs leading-5 text-neutral-500">
          Built for verified workshop participants and project submissions.
        </p>
      </div>
    </main>
  );
}
