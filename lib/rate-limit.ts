import "server-only";

import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";

const rateLimitEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1)
});

export function getIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function rateLimitByIp(
  request: NextRequest,
  bucket: string,
  limit: number,
  windowSeconds: number
) {
  const env = rateLimitEnvSchema.safeParse(getServerEnv());

  if (!env.success) {
    return { ok: false, reason: "rate_limit_unconfigured" as const };
  }

  const redis = new Redis({
    url: env.data.UPSTASH_REDIS_REST_URL,
    token: env.data.UPSTASH_REDIS_REST_TOKEN
  });
  const key = `rate:${bucket}:${getIp(request)}`;
  const hits = await redis.incr(key);

  if (hits === 1) {
    await redis.expire(key, windowSeconds);
  }

  return { ok: hits <= limit, reason: hits <= limit ? null : ("rate_limited" as const) };
}
