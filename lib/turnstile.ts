import "server-only";

import { z } from "zod";
import { getServerEnv } from "@/lib/env";

const turnstileResponseSchema = z.object({
  success: z.boolean(),
  "error-codes": z.array(z.string()).optional()
});

export async function verifyTurnstile(token: string, remoteIp?: string | null) {
  const env = getServerEnv();

  if (!env.TURNSTILE_SECRET_KEY) {
    throw new Error("TURNSTILE_SECRET_KEY is required for profile creation.");
  }

  const formData = new FormData();
  formData.append("secret", env.TURNSTILE_SECRET_KEY);
  formData.append("response", token);

  if (remoteIp) {
    formData.append("remoteip", remoteIp);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData
  });
  const body = turnstileResponseSchema.parse(await response.json());

  return body.success;
}
