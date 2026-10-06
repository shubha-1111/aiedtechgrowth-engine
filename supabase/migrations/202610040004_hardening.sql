drop policy if exists "fraud_flags_insert_own" on public.fraud_flags;
drop policy if exists "fraud_flags_update_own" on public.fraud_flags;
drop policy if exists "fraud_flags_delete_own" on public.fraud_flags;

create index if not exists fraud_flags_created_at_idx
  on public.fraud_flags(created_at desc);

alter table public.poll_votes
  drop constraint if exists poll_votes_choice_check;

alter table public.poll_votes
  add constraint poll_votes_choice_check check (
    choice in ('AI tools', 'Web apps', 'Automation')
  );

alter table public.milestone_progress
  drop constraint if exists milestone_progress_milestone_check;

alter table public.milestone_progress
  add constraint milestone_progress_milestone_check check (
    milestone in ('Joined live', 'Built first screen', 'Submitted project')
  );
