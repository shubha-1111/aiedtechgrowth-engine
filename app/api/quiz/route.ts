import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { incrementCounter, QUIZ_DONE_KEY } from "@/lib/analytics";
import { generate } from "@/lib/llm";
import { rateLimitByIp } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  PROMPT_VERSION,
  branchLabels,
  interestLabels,
  quizIdeaSchema,
  quizInputSchema,
  quizResponseSchema,
  skillLabels,
  timeBracketLabels,
  type QuizIdea,
  type QuizInput
} from "@/lib/quiz";

export const runtime = "nodejs";
const QUIZ_LLM_TIMEOUT_MS = 2200;

function buildCacheKey(input: QuizInput) {
  return createHash("sha256")
    .update(`${PROMPT_VERSION}${input.branch}${input.skill}${input.interest}${input.time}`)
    .digest("hex");
}

function buildPromptInput(input: QuizInput) {
  return {
    prompt_version: PROMPT_VERSION,
    branch: branchLabels[input.branch],
    skill_level: skillLabels[input.skill],
    interest: interestLabels[input.interest],
    time_available: timeBracketLabels[input.time],
    audience: "final-year engineering student",
    workshop: "Build Your First AI Project in 60 Minutes",
    constraints: [
      "project must be realistic for a beginner workshop",
      "steps must be specific and resume-friendly",
      "tools must be common web or AI tools"
    ]
  };
}

function templateToIdea(row: { title: string; steps: unknown; slug?: string }): QuizIdea {
  const parsed = z
    .object({
      description: z.string(),
      steps: z.array(z.string()),
      tools: z.array(z.string()),
      why_it_helps_resume: z.string()
    })
    .safeParse(row.steps);

  if (parsed.success) {
    return quizIdeaSchema.parse({
      title: row.title,
      slug: row.slug,
      ...parsed.data
    });
  }

  return quizIdeaSchema.parse({
    title: row.title,
    slug: row.slug,
    description:
      "A guided starter project matched to your interest, built to be completed quickly and explained clearly in interviews.",
    steps: [
      "Pick one simple user problem and define the input and output.",
      "Build the first version with a small, testable workflow.",
      "Add a polished result screen and write a short project note."
    ],
    tools: ["Next.js", "Supabase", "Groq"],
    why_it_helps_resume:
      "It gives you a concrete project story with a problem, implementation steps, and measurable outcome to discuss with recruiters."
  });
}

function getBuiltInFallback(input: QuizInput) {
  const interest = interestLabels[input.interest];
  const branch = branchLabels[input.branch];
  const time = timeBracketLabels[input.time];

  return quizIdeaSchema.parse({
    title: `${interest} Starter for ${branch}`,
    description: `Build a focused ${interest.toLowerCase()} project for ${branch} students that can be scoped to a ${time} workshop follow-up.`,
    steps: [
      "Pick one student problem and write the expected input and output.",
      "Build a small working flow with sample inputs and a clear result screen.",
      "Add one AI-assisted recommendation, summary, or explanation step.",
      "Test it on mobile and write a short README with screenshots."
    ],
    tools: ["Next.js", "Supabase", "Groq"],
    why_it_helps_resume:
      "It gives you a concrete project story with a problem, product flow, AI usage, and demo-ready result to discuss with recruiters."
  });
}

async function getTemplateFallback(input: QuizInput) {
  const supabase = createSupabaseAdminClient();
  const exact = await supabase
    .from("project_templates")
    .select("title, steps, slug")
    .contains("branches", [input.branch])
    .eq("interest", input.interest)
    .eq("level", input.skill)
    .limit(1)
    .maybeSingle();

  if (exact.data) {
    return templateToIdea(exact.data);
  }

  const byInterestLevel = await supabase
    .from("project_templates")
    .select("title, steps, slug")
    .eq("interest", input.interest)
    .eq("level", input.skill)
    .limit(1)
    .maybeSingle();

  if (byInterestLevel.data) {
    return templateToIdea(byInterestLevel.data);
  }

  const byInterest = await supabase
    .from("project_templates")
    .select("title, steps, slug")
    .eq("interest", input.interest)
    .limit(1)
    .maybeSingle();

  if (byInterest.data) {
    return templateToIdea(byInterest.data);
  }

  return getBuiltInFallback(input);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error("quiz_generation_timeout")), timeoutMs);
    })
  ]);
}

export async function POST(request: NextRequest) {
  const rateLimit = await rateLimitByIp(request, "quiz", 10, 60);

  if (rateLimit.reason === "rate_limit_unconfigured") {
    return NextResponse.json({ error: "Rate limit is not configured." }, { status: 503 });
  }

  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Too many quiz attempts. Try again soon." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = quizInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quiz input." }, { status: 400 });
  }

  const input = parsed.data;
  const cacheKey = buildCacheKey(input);
  const supabase = createSupabaseAdminClient();

  const cached = await supabase
    .from("quiz_cache")
    .select("idea")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (cached.data?.idea) {
    const idea = quizIdeaSchema.parse(cached.data.idea);
    await incrementCounter(QUIZ_DONE_KEY);
    return NextResponse.json(
      quizResponseSchema.parse({
        submission: input,
        cache_key: cacheKey,
        idea,
        source: "cache"
      })
    );
  }

  let idea: QuizIdea;
  let source: "llm" | "template" = "llm";

  const templateIdea = await getTemplateFallback(input);

  try {
    idea = await withTimeout(
      generate("quiz_idea", buildPromptInput(input), quizIdeaSchema),
      QUIZ_LLM_TIMEOUT_MS
    );
    idea.slug = templateIdea.slug;
  } catch {
    idea = templateIdea;
    source = "template";
  }

  await supabase.from("quiz_cache").upsert({
    cache_key: cacheKey,
    idea,
    prompt_version: PROMPT_VERSION
  });

  await incrementCounter(QUIZ_DONE_KEY);

  return NextResponse.json(
    quizResponseSchema.parse({
      submission: input,
      cache_key: cacheKey,
      idea,
      source
    })
  );
}
