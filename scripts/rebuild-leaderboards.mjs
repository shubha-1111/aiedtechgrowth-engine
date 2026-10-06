import { Redis } from "@upstash/redis";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const INDIVIDUAL_KEY = "leaderboard:individual";
const COLLEGE_KEY = "leaderboard:college";

function loadDotEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");

  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);

    if (!match || process.env[match[1]]) {
      continue;
    }

    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

loadDotEnvLocal();

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN"
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is required.`);
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

const { data, error } = await supabase
  .from("referrals")
  .select("referrer_id, profiles!referrals_referrer_id_fkey(college)")
  .eq("counted", true);

if (error) {
  throw error;
}

const individual = new Map();
const colleges = new Map();

for (const row of data ?? []) {
  individual.set(row.referrer_id, (individual.get(row.referrer_id) ?? 0) + 1);

  const college = row.profiles?.college;

  if (college) {
    colleges.set(college, (colleges.get(college) ?? 0) + 1);
  }
}

await redis.del(INDIVIDUAL_KEY, COLLEGE_KEY);

for (const [member, score] of individual) {
  await redis.zadd(INDIVIDUAL_KEY, { member, score });
}

for (const [member, score] of colleges) {
  await redis.zadd(COLLEGE_KEY, { member, score });
}

console.log(`Rebuilt ${individual.size} individual and ${colleges.size} college leaderboard rows.`);
