import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

export const ATTRIBUTION_COOKIE = "nxtwave_attribution";

const attributionCookieSchema = z.object({
  ref: z.string().min(1).max(128).nullable().optional(),
  utm_source: z.string().min(1).max(128).nullable().optional(),
  captured_at: z.string().optional()
});

export function getAttributionCookie() {
  const raw = cookies().get(ATTRIBUTION_COOKIE)?.value;

  if (!raw) {
    return { ref: null, utm_source: null };
  }

  const body = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })();
  const parsed = attributionCookieSchema.safeParse(body);

  if (!parsed.success) {
    return { ref: null, utm_source: null };
  }

  return {
    ref: parsed.data.ref ?? null,
    utm_source: parsed.data.utm_source ?? null
  };
}

export function clearAttributionCookie() {
  cookies().set({
    name: ATTRIBUTION_COOKIE,
    value: "",
    maxAge: 0,
    path: "/"
  });
}
