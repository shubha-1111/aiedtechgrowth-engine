import "server-only";

import { Redis } from "@upstash/redis";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const INDIVIDUAL_LEADERBOARD_KEY = "leaderboard:individual";
export const COLLEGE_LEADERBOARD_KEY = "leaderboard:college";

const redisEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1)
});

type LeaderboardEntry = {
  id: string;
  name: string;
  college: string;
  score: number;
};

type CollegeEntry = {
  college: string;
  score: number;
};

function getRedis() {
  const parsed = redisEnvSchema.safeParse(getServerEnv());

  if (!parsed.success) {
    return null;
  }

  return new Redis({
    url: parsed.data.UPSTASH_REDIS_REST_URL,
    token: parsed.data.UPSTASH_REDIS_REST_TOKEN
  });
}

function parseScoredMembers(rows: unknown[]) {
  const entries: Array<{ member: string; score: number }> = [];

  for (let index = 0; index < rows.length; index += 2) {
    const member = String(rows[index] ?? "");
    const score = Number(rows[index + 1] ?? 0);

    if (member) {
      entries.push({ member, score });
    }
  }

  return entries;
}

export async function syncReferralLeaderboards(input: {
  referrerId: string;
  referrerCollege: string | null;
}) {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  await redis.zincrby(INDIVIDUAL_LEADERBOARD_KEY, 1, input.referrerId);

  if (input.referrerCollege) {
    await redis.zincrby(COLLEGE_LEADERBOARD_KEY, 1, input.referrerCollege);
  }
}

export async function getMyReferralCount(userId: string) {
  const redis = getRedis();

  if (redis) {
    const score = await redis.zscore(INDIVIDUAL_LEADERBOARD_KEY, userId);
    return Number(score ?? 0);
  }

  const supabase = createSupabaseAdminClient();
  const { count } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId)
    .eq("counted", true);

  return count ?? 0;
}

export async function getIndividualLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const redis = getRedis();

  if (!redis) {
    return [];
  }

  const scored = parseScoredMembers(
    await redis.zrange(INDIVIDUAL_LEADERBOARD_KEY, 0, limit - 1, {
      rev: true,
      withScores: true
    })
  );

  if (scored.length === 0) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, name, college")
    .in(
      "id",
      scored.map((entry) => entry.member)
    );
  const profiles = new Map((data ?? []).map((profile) => [profile.id, profile]));

  return scored.map((entry) => {
    const profile = profiles.get(entry.member);

    return {
      id: entry.member,
      name: profile?.name || "Student",
      college: profile?.college || "College pending",
      score: entry.score
    };
  });
}

export async function getCollegeLeaderboard(limit = 10): Promise<CollegeEntry[]> {
  const redis = getRedis();

  if (!redis) {
    return [];
  }

  return parseScoredMembers(
    await redis.zrange(COLLEGE_LEADERBOARD_KEY, 0, limit - 1, {
      rev: true,
      withScores: true
    })
  ).map((entry) => ({
    college: entry.member,
    score: entry.score
  }));
}
