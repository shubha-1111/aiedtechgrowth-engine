import "server-only";

import Groq from "groq-sdk";
import type { z } from "zod";
import { getServerEnv } from "@/lib/env";

type TaskName = "quiz_idea" | "submission_score";

export async function generate<TSchema extends z.ZodTypeAny>(
  task: TaskName,
  input: unknown,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const env = getServerEnv();

  if (!env.GROQ_API_KEY || !env.GROQ_MODEL) {
    throw new Error("GROQ_API_KEY and GROQ_MODEL are required for LLM generation.");
  }

  const groq = new Groq({ apiKey: env.GROQ_API_KEY });
  const prompt = JSON.stringify({
    task,
    input,
    required_output:
      task === "quiz_idea"
        ? {
            title: "string",
            description: "string",
            steps: ["3 to 5 specific strings"],
            tools: ["1 to 6 short tool names"],
            why_it_helps_resume: "string"
          }
        : {
            works: { score: "integer 0-5", reason: "one line" },
            meaningful_ai_use: { score: "integer 0-5", reason: "one line" },
            clarity: { score: "integer 0-5", reason: "one line" },
            originality: { score: "integer 0-5", reason: "one line" },
            feedback: ["exactly 3 strings"]
          }
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const completion = await groq.chat.completions.create({
        model: env.GROQ_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Return only valid JSON matching the requested keys and value constraints. Do not include markdown, comments, or extra keys."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        continue;
      }

      return schema.parse(JSON.parse(content));
    } catch {
      if (attempt === 1) {
        break;
      }
    }
  }

  throw new Error(`LLM generation failed for task: ${task}`);
}
