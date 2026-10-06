# Workshop Growth Engine: rules for the coding agent

GOAL: A referral + AI-evaluation web app for NxtWave's free workshop "Build Your First AI Project in 60 Minutes". Target: 500 registrations from final-year engineering students. Simulation only. Seed data must be labelled DEMO.

STACK: Next.js (App Router, TypeScript, Node runtime only, no Edge), Tailwind, Supabase (Postgres, Auth with Google OAuth, RLS, Realtime), Upstash Redis (REST), Cloudflare Turnstile, Groq via groq-sdk, Zod, Vercel.

DO NOT USE: email services, embeddings, pgvector, LangChain, queues, microservices. Do not add dependencies without asking.

RULES
- Mobile-first UI. Simple, fast, minimal dependencies.
- All env vars in .env.local; list them in .env.example (no real values). Model name comes from GROQ_MODEL env var.
- Service role key and Groq key are server-side only, never in client code.
- Validate every API input and every LLM output with Zod. Retry LLM JSON once, then fall back.
- All LLM calls go through one function: lib/llm.ts generate(task, input, schema).
- Use parameterized queries only. Enable RLS on every table, with policies.
- Rate-limit public endpoints with Upstash.
- Submissions: return 202 + submission_id immediately, process in the background, client polls GET /api/submissions/:id every 3s.
- Quiz: cache key = SHA-256(prompt_version + branch + skill + interest + time). No free-text quiz fields.
- Each task: make the smallest change that works, run lint and build, then summarise what changed and how to test it.
