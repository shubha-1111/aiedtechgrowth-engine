import { Redis } from "@upstash/redis";
import { getServerEnv } from "./env";

export function getRedisClient() {
  const env = getServerEnv();
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN
  });
}

import { createSupabaseAdminClient } from "./supabase/admin";

export async function rebuildLeaderboards() {
  const redis = getRedisClient();
  if (!redis) return;
  
  const adminSupabase = createSupabaseAdminClient();
  
  // 1. Rebuild students
  const { data: allReferrals } = await adminSupabase.from("referrals").select("referrer_id");
  const studentMap: Record<string, number> = {};
  (allReferrals || []).forEach(r => {
    studentMap[r.referrer_id] = (studentMap[r.referrer_id] || 0) + 1;
  });
  
  const studentPipeline = redis.pipeline();
  studentPipeline.del("leaderboard:students");
  for (const [id, count] of Object.entries(studentMap)) {
    studentPipeline.zadd("leaderboard:students", { score: count, member: id });
  }
  await studentPipeline.exec();
  
  // 2. Rebuild colleges
  const { data: allProfiles } = await adminSupabase.from("profiles").select("college");
  const collegeMap: Record<string, number> = {};
  (allProfiles || []).forEach(p => {
    if (p.college) {
      collegeMap[p.college] = (collegeMap[p.college] || 0) + 1;
    }
  });
  
  const collegePipeline = redis.pipeline();
  collegePipeline.del("leaderboard:colleges");
  for (const [college, count] of Object.entries(collegeMap)) {
    collegePipeline.zadd("leaderboard:colleges", { score: count, member: college });
  }
  await collegePipeline.exec();
}
