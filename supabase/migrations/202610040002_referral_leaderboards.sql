alter table public.referrals
  alter column counted set default true;

create index if not exists referrals_counted_referrer_id_idx
  on public.referrals(referrer_id)
  where counted = true;

create index if not exists referrals_counted_created_at_idx
  on public.referrals(created_at desc)
  where counted = true;
