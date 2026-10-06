import "server-only";

import { Redis } from "@upstash/redis";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";

export const VISITS_KEY = "funnel:visits";
export const QUIZ_DONE_KEY = "funnel:quiz_done";

const redisEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1)
});

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

export async function incrementCounter(key: string) {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  await redis.incr(key);
}

export async function getCounter(key: string) {
  const redis = getRedis();

  if (!redis) {
    return 0;
  }

  return Number((await redis.get(key)) ?? 0);
}
