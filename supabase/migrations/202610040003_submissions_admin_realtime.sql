create extension if not exists pg_trgm;

alter table public.submissions
  drop constraint if exists submissions_status_check;

alter table public.submissions
  add constraint submissions_status_check check (
    status in ('queued', 'processing', 'done', 'needs_review', 'pending', 'completed', 'failed')
  );

alter table public.submissions
  alter column status set default 'queued';

alter table public.submissions
  add column if not exists readme_text text,
  add column if not exists readme_fingerprint text;

create index if not exists submissions_readme_text_trgm_idx
  on public.submissions using gin(readme_text gin_trgm_ops);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  choice text not null,
  created_at timestamptz not null default now(),
  constraint poll_votes_user_unique unique (user_id)
);

create table if not exists public.milestone_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  milestone text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint milestone_progress_user_milestone_unique unique (user_id, milestone)
);

alter table public.poll_votes enable row level security;
alter table public.milestone_progress enable row level security;

create policy "poll_votes_select_all_authenticated"
  on public.poll_votes for select
  to authenticated
  using (true);

create policy "poll_votes_insert_own"
  on public.poll_votes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "poll_votes_update_own"
  on public.poll_votes for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "milestone_progress_select_own"
  on public.milestone_progress for select
  to authenticated
  using (user_id = auth.uid());

create policy "milestone_progress_insert_own"
  on public.milestone_progress for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "milestone_progress_update_own"
  on public.milestone_progress for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists poll_votes_choice_idx on public.poll_votes(choice);
create index if not exists milestone_progress_user_id_idx on public.milestone_progress(user_id);

create or replace function public.find_similar_submission(
  candidate_text text,
  current_submission_id uuid,
  min_similarity real default 0.82
)
returns table(id uuid, user_id uuid, similarity_score real)
language sql
security definer
set search_path = public
as $$
  select s.id, s.user_id, similarity(s.readme_text, candidate_text) as similarity_score
  from public.submissions s
  where s.id <> current_submission_id
    and s.readme_text is not null
    and similarity(s.readme_text, candidate_text) >= min_similarity
  order by similarity_score desc
  limit 1;
$$;
