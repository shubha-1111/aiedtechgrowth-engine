import { z } from "zod";

export const submissionInputSchema = z.object({
  url: z
    .string()
    .url("Please enter a valid URL (e.g., https://github.com/user/project or https://myproject.vercel.app)"),
  turnstileToken: z.string().optional()
});

export const submissionScoreSchema = z.object({
  works: z.object({
    score: z.number().int().min(0).max(5),
    reason: z.string().min(4).max(180)
  }),
  meaningful_ai_use: z.object({
    score: z.number().int().min(0).max(5),
    reason: z.string().min(4).max(180)
  }),
  clarity: z.object({
    score: z.number().int().min(0).max(5),
    reason: z.string().min(4).max(180)
  }),
  originality: z.object({
    score: z.number().int().min(0).max(5),
    reason: z.string().min(4).max(180)
  }),
  feedback: z.array(z.string().min(4).max(180)).length(3)
});

export type SubmissionInput = z.infer<typeof submissionInputSchema>;
export type SubmissionScore = z.infer<typeof submissionScoreSchema>;

export function getFallbackSubmissionScore(url: string): SubmissionScore {
  return {
    works: { score: 5, reason: "The project seems to be functioning well." },
    meaningful_ai_use: { score: 4, reason: "Good integration of AI components." },
    clarity: { score: 5, reason: "The submission is clear and easy to understand." },
    originality: { score: 4, reason: "Shows some good original thinking." },
    feedback: [
      "Great work building an interactive workshop project!",
      "The application shows clear modular code structure.",
      "Working API endpoints and practical student utility."
    ]
  };
}
