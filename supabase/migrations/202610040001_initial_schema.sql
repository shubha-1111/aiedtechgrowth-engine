create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  college text,
  branch text,
  year integer,
  whatsapp_opt_in boolean not null default false,
  ref_code text not null unique,
  referred_by uuid references public.profiles(id) on delete set null,
  source_utm jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null unique references public.profiles(id) on delete cascade,
  counted boolean not null default false,
  created_at timestamptz not null default now(),
  constraint referrals_no_self_referral check (referrer_id <> referred_id)
);

create table public.quiz_cache (
  cache_key text primary key,
  idea jsonb not null,
  prompt_version text not null,
  created_at timestamptz not null default now()
);

create table public.project_templates (
  id uuid primary key default gen_random_uuid(),
  branch text not null,
  interest text not null,
  level text not null,
  title text not null,
  steps jsonb not null,
  created_at timestamptz not null default now(),
  constraint project_templates_unique_track unique (branch, interest, level)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  status text not null default 'pending',
  score jsonb,
  created_at timestamptz not null default now(),
  constraint submissions_status_check check (
    status in ('pending', 'processing', 'completed', 'failed')
  )
);

create table public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

create index profiles_referred_by_idx on public.profiles(referred_by);
create index profiles_created_at_idx on public.profiles(created_at desc);
create index referrals_referrer_id_idx on public.referrals(referrer_id);
create index referrals_created_at_idx on public.referrals(created_at desc);
create index quiz_cache_prompt_version_idx on public.quiz_cache(prompt_version);
create index project_templates_lookup_idx on public.project_templates(branch, interest, level);
create index submissions_user_id_created_at_idx on public.submissions(user_id, created_at desc);
create index submissions_status_idx on public.submissions(status);
create index fraud_flags_user_id_created_at_idx on public.fraud_flags(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.referrals enable row level security;
alter table public.quiz_cache enable row level security;
alter table public.project_templates enable row level security;
alter table public.submissions enable row level security;
alter table public.fraud_flags enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using (id = auth.uid());

create policy "referrals_select_own"
  on public.referrals for select
  to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid());

create policy "referrals_insert_own"
  on public.referrals for insert
  to authenticated
  with check (referrer_id = auth.uid() or referred_id = auth.uid());

create policy "referrals_update_own"
  on public.referrals for update
  to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid())
  with check (referrer_id = auth.uid() or referred_id = auth.uid());

create policy "referrals_delete_own"
  on public.referrals for delete
  to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid());

create policy "submissions_select_own"
  on public.submissions for select
  to authenticated
  using (user_id = auth.uid());

create policy "submissions_insert_own"
  on public.submissions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "submissions_update_own"
  on public.submissions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "submissions_delete_own"
  on public.submissions for delete
  to authenticated
  using (user_id = auth.uid());

create policy "fraud_flags_select_own"
  on public.fraud_flags for select
  to authenticated
  using (user_id = auth.uid());

create policy "fraud_flags_insert_own"
  on public.fraud_flags for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "fraud_flags_update_own"
  on public.fraud_flags for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "fraud_flags_delete_own"
  on public.fraud_flags for delete
  to authenticated
  using (user_id = auth.uid());
