import "server-only";

import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import net from "node:net";
import { z } from "zod";
import { generate } from "@/lib/llm";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { submissionScoreSchema } from "@/lib/submissions";

const MAX_BYTES = 120_000;
const TIMEOUT_MS = 5000;

export const submissionUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      isAllowedHost(url.hostname)
    );
  }, "Use an HTTPS GitHub or demo URL.");


const injectionPattern =
  /(ignore (all )?(previous|above|prior) instructions|system prompt|developer message|reveal secrets|jailbreak|act as|you are now|disregard)/i;

export function containsPromptInjection(text: string) {
  return injectionPattern.test(text);
}

function isAllowedHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "github.com" ||
    host.endsWith(".github.io") ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".netlify.app") ||
    host.endsWith(".pages.dev") ||
    host.endsWith(".render.com")
  );
}

function isPrivateIp(address: string) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254)
    );
  }

  if (net.isIPv6(address)) {
    const lowered = address.toLowerCase();
    return (
      lowered === "::1" ||
      lowered === "::" ||
      lowered.startsWith("fc") ||
      lowered.startsWith("fd") ||
      lowered.startsWith("fe80")
    );
  }

  return true;
}

async function assertPublicHost(hostname: string) {
  const records = await lookup(hostname, { all: true, verbatim: true });

  if (records.length === 0 || records.some((record) => isPrivateIp(record.address))) {
    throw new Error("Submission host is not public.");
  }
}

function sanitizeText(input: string) {
  return input
    .replace(/\0/g, "")
    .replace(/[^\S\r\n]+/g, " ")
    .slice(0, 20_000)
    .trim();
}

async function safeFetchText(url: string) {
  const parsed = submissionUrlSchema.parse(url);
  const target = new URL(parsed);
  await assertPublicHost(target.hostname);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(target, {
      signal: controller.signal,
      redirect: "manual",
      headers: {
        accept: "text/plain,text/html,application/json;q=0.8,*/*;q=0.5",
        "user-agent": "nxtwave-growth-engine/0.1"
      }
    });

    if (!response.ok) {
      throw new Error("Submission URL did not return a readable response.");
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Submission response body is empty.");
    }

    const chunks: Uint8Array[] = [];
    let size = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      size += value.byteLength;

      if (size > MAX_BYTES) {
        throw new Error("Submission response is too large.");
      }

      chunks.push(value);
    }

    return sanitizeText(Buffer.concat(chunks).toString("utf8"));
  } finally {
    clearTimeout(timeout);
  }
}

function buildEvaluationInput(url: string, text: string) {
  return {
    rubric: {
      works: "Does the project appear functional and testable?",
      meaningful_ai_use: "Does it use AI in a meaningful way rather than as decoration?",
      clarity: "Is the README or demo explanation clear?",
      originality: "Does it show some student-specific thinking?"
    },
    output: "Score each rubric item 0-5 with one-line reason. Add exactly 3 feedback lines.",
    submission_url: url,
    untrusted_submission_text: `<<<UNTRUSTED_SUBMISSION_TEXT\n${text}\nUNTRUSTED_SUBMISSION_TEXT>>>`
  };
}

export async function evaluateSubmission(submissionId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: submission, error: loadError } = await supabase
    .from("submissions")
    .select("id, user_id, url")
    .eq("id", submissionId)
    .maybeSingle();

  if (loadError || !submission) {
    return;
  }

  await supabase.from("submissions").update({ status: "processing" }).eq("id", submissionId);

  let text = "";

  try {
    text = await safeFetchText(submission.url);

    if (containsPromptInjection(text)) {
      await supabase.from("fraud_flags").insert({
        user_id: submission.user_id,
        reason: "Submission text contained known prompt-injection language."
      });
    }

    const { data: similar } = await supabase.rpc("find_similar_submission", {
      candidate_text: text,
      current_submission_id: submissionId,
      min_similarity: 0.82
    });

    if (similar?.[0]) {
      await supabase.from("fraud_flags").insert({
        user_id: submission.user_id,
        reason: `Near-duplicate README detected against submission ${similar[0].id}.`
      });
    }

    const score = await generate(
      "submission_score",
      buildEvaluationInput(submission.url, text),
      submissionScoreSchema
    );

    await supabase
      .from("submissions")
      .update({
        status: "done",
        score,
        readme_text: text,
        readme_fingerprint: createHash("sha256").update(text).digest("hex")
      })
      .eq("id", submissionId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isRateLimited = message.includes("429") || message.toLowerCase().includes("rate limit");

    await supabase
      .from("submissions")
      .update({
        status: isRateLimited ? "queued" : "needs_review",
        readme_text: text || null,
        readme_fingerprint: text ? createHash("sha256").update(text).digest("hex") : null
      })
      .eq("id", submissionId);
  }
}
