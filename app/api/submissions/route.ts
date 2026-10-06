import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimitByIp } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { evaluateSubmission, submissionUrlSchema } from "@/lib/submissions/evaluator";

export const runtime = "nodejs";

const createSubmissionSchema = z.object({
  url: submissionUrlSchema
});

export async function POST(request: NextRequest) {
  const rateLimit = await rateLimitByIp(request, "submissions", 5, 60);

  if (rateLimit.reason === "rate_limit_unconfigured") {
    return NextResponse.json({ error: "Rate limit is not configured." }, { status: 503 });
  }

  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Too many submissions. Try again soon." }, { status: 429 });
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Use an HTTPS GitHub or approved demo URL." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Complete your profile first." }, { status: 403 });
  }

  const { data, error } = await admin
    .from("submissions")
    .insert({
      user_id: user.id,
      url: parsed.data.url,
      status: "queued"
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not create submission." }, { status: 500 });
  }

  void evaluateSubmission(data.id);

  return NextResponse.json({ submission_id: data.id }, { status: 202 });
}
