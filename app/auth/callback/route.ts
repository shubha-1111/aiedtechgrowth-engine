import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_exchange_failed", request.url));
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();

    if (!profile.data) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
