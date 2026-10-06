import { redirect } from "next/navigation";
import { SubmissionForm } from "@/components/submissions/SubmissionForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();

  if (!profile) {
    redirect("/profile");
  }

  return (
    <main className="min-h-dvh bg-[#f7faf8] px-5 py-6">
      <div className="mx-auto max-w-xl">
        <SubmissionForm />
      </div>
    </main>
  );
}
