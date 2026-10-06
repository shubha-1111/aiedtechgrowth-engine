"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearAttributionCookie, getAttributionCookie } from "@/lib/attribution";
import { syncReferralLeaderboards } from "@/lib/leaderboard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";

const profileFormSchema = z.object({
  college: z.string().trim().min(2).max(120),
  branch: z.string().trim().min(2).max(80),
  year: z.coerce.number().int().min(1).max(5),
  whatsapp_opt_in: z.boolean(),
  turnstile_token: z.string().min(1)
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function makeRefCode() {
  return randomBytes(5).toString("base64url").toUpperCase();
}

async function generateUniqueRefCode() {
  const supabase = createSupabaseAdminClient();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const refCode = makeRefCode();
    const existing = await supabase
      .from("profiles")
      .select("id")
      .eq("ref_code", refCode)
      .maybeSingle();

    if (!existing.data) {
      return refCode;
    }
  }

  throw new Error("Could not generate a unique referral code.");
}

export async function createProfile(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const parsed = profileFormSchema.safeParse({
    college: getString(formData, "college"),
    branch: getString(formData, "branch"),
    year: getString(formData, "year"),
    whatsapp_opt_in: formData.get("whatsapp_opt_in") === "on",
    turnstile_token: getString(formData, "cf-turnstile-response")
  });

  if (!parsed.success) {
    redirect("/profile?error=invalid_profile");
  }

  const forwardedFor = headers().get("x-forwarded-for")?.split(",")[0]?.trim();
  const turnstilePassed = await verifyTurnstile(parsed.data.turnstile_token, forwardedFor);

  if (!turnstilePassed) {
    redirect("/profile?error=turnstile_failed");
  }

  const admin = createSupabaseAdminClient();
  const existingProfile = await admin
    .from("profiles")
    .select("id, ref_code")
    .eq("id", user.id)
    .maybeSingle();
  const attribution = getAttributionCookie();
  const refCode = existingProfile.data?.ref_code ?? (await generateUniqueRefCode());
  let referredBy: string | null = null;

  if (!existingProfile.data && attribution.ref) {
    const referrer = await admin
      .from("profiles")
      .select("id, college")
      .eq("ref_code", attribution.ref)
      .maybeSingle();

    if (referrer.data && referrer.data.id !== user.id) {
      referredBy = referrer.data.id;
    }
  }

  const name =
    user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || null;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      name,
      college: parsed.data.college,
      branch: parsed.data.branch,
      year: parsed.data.year,
      whatsapp_opt_in: parsed.data.whatsapp_opt_in,
      ref_code: refCode,
      referred_by: referredBy,
      source_utm: {
        ref: attribution.ref,
        utm_source: attribution.utm_source
      }
    },
    { onConflict: "id" }
  );

  if (profileError) {
    redirect("/profile?error=save_failed");
  }

  if (referredBy) {
    const { data: createdReferral, error: referralError } = await admin
      .from("referrals")
      .upsert(
        {
          referrer_id: referredBy,
          referred_id: user.id,
          counted: true
        },
        { onConflict: "referred_id", ignoreDuplicates: true }
      )
      .select("id")
      .maybeSingle();

    if (!referralError && createdReferral) {
      const { data: referrerProfile } = await admin
        .from("profiles")
        .select("college")
        .eq("id", referredBy)
        .maybeSingle();

      await syncReferralLeaderboards({
        referrerId: referredBy,
        referrerCollege: referrerProfile?.college ?? null
      });
    } else if (referralError && referralError.code !== "23505" && referralError.code !== "23514") {
      redirect("/profile?error=referral_failed");
    }
  }

  clearAttributionCookie();
  redirect("/dashboard");
}
