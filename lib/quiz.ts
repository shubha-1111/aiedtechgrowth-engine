import { z } from "zod";

export const PROMPT_VERSION = "quiz_idea_v1";

export const branches = [
  "cse",
  "it",
  "ece",
  "aiml_ds",
  "cyber",
  "other"
] as const;

export const skills = ["beginner", "intermediate", "advanced"] as const;

export const interests = [
  "careers",
  "security",
  "healthcare_info",
  "finance",
  "education"
] as const;

export const timeBrackets = ["30_min", "1_hour", "2_hours", "weekend"] as const;

export const branchLabels: Record<(typeof branches)[number], string> = {
  cse: "CSE",
  it: "IT",
  ece: "ECE",
  aiml_ds: "AIML-DS",
  cyber: "Cyber",
  other: "Other"
};

export const skillLabels: Record<(typeof skills)[number], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced"
};

export const interestLabels: Record<(typeof interests)[number], string> = {
  careers: "Careers",
  security: "Security",
  healthcare_info: "Healthcare-info",
  finance: "Finance",
  education: "Education"
};

export const timeBracketLabels: Record<(typeof timeBrackets)[number], string> = {
  "30_min": "30 minutes",
  "1_hour": "1 hour",
  "2_hours": "2 hours",
  weekend: "Weekend"
};

export const quizInputSchema = z.object({
  branch: z.enum(branches),
  skill: z.enum(skills),
  interest: z.enum(interests),
  time: z.enum(timeBrackets)
});

export const quizIdeaSchema = z.object({
  title: z.string().min(4).max(120),
  description: z.string().min(20).max(500),
  steps: z.array(z.string().min(4).max(220)).min(3).max(5),
  tools: z.array(z.string().min(1).max(40)).min(1).max(6),
  why_it_helps_resume: z.string().min(20).max(500),
  slug: z.string().optional()
});

export const quizResponseSchema = z.object({
  submission: quizInputSchema,
  cache_key: z.string().length(64),
  idea: quizIdeaSchema,
  source: z.enum(["cache", "llm", "template"])
});

export type QuizInput = z.infer<typeof quizInputSchema>;
export type QuizIdea = z.infer<typeof quizIdeaSchema>;
export type QuizResponse = z.infer<typeof quizResponseSchema>;
