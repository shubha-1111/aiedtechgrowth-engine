# NxtWave Workshop Growth Engine

Simulation app for NxtWave's free workshop, "Build Your First AI Project in 60 Minutes".

## Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

3. Fill `.env.local` with your Supabase, Upstash, Turnstile, and Groq values. At minimum, Google login needs:

   ```bash
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

4. Apply the SQL migration in `supabase/migrations` to your Supabase project.

5. Start the app:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000`.

## Seed Quiz Ideas

After applying the migration and filling `.env.local`, seed DEMO fallback ideas and warmed cache rows:

```bash
npm run seed:quiz
```

The seed script writes DEMO-labelled rows to `project_templates` and `quiz_cache`.

## Referrals, Submissions, and Admin

- First-time Google sign-ins are sent to `/profile` for college, branch, year, WhatsApp consent, and Turnstile verification.
- Verified profiles get a referral link on `/dashboard`.
- Rebuild leaderboard sorted sets from Postgres:

  ```bash
  npm run rebuild:leaderboards
  ```

- Submit a GitHub/demo project at `/submit`; the client polls `/api/submissions/:id` every 3 seconds.
- Scored submissions can be shared from `/certificate/:id`.
- Admin users with `role=admin` in Supabase auth metadata can view `/admin`.

## Test Google Login

1. In Supabase, enable Google as an auth provider.
2. In Google Cloud Console, add this authorized redirect URI:

   ```text
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```

3. In Supabase Auth URL Configuration, set:

   ```text
   Site URL: http://localhost:3000
   Redirect URLs: http://localhost:3000/auth/callback
   ```

4. Run the app and click `Continue with Google` on `/login`.
5. After the OAuth flow, Supabase redirects back to `/auth/callback`, the app exchanges the code for a session, and `/dashboard` should load.

## Notes

- This is a simulation-only scaffold.
- Seed data must be labelled `DEMO`.
- Secrets such as `SUPABASE_SERVICE_ROLE_KEY` and `GROQ_API_KEY` are server-only and must never be exposed in client components.

## 🚀 Live Project

👉 [Try the Live Project](https://aiedtechgrowth-engine.vercel.app)

## 🎥 Project Demo

<p align="center">
  <a href="https://www.youtube.com/watch?v=TGxfWGL8iNc">
    <img src="https://img.youtube.com/vi/TGxfWGL8iNc/maxresdefault.jpg"
         width="800"
         alt="Watch Project Demo">
  </a>
</p>

<p align="center">
  <b>▶️ Click the preview to watch the full demo</b>
</p>
