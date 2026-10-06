alter table public.project_templates drop constraint if exists project_templates_unique_track;
drop index if exists project_templates_lookup_idx;

alter table public.project_templates drop column if exists branch;

alter table public.project_templates add column if not exists slug text unique;
alter table public.project_templates add column if not exists branches text[];
alter table public.project_templates add column if not exists time_minutes integer;
alter table public.project_templates add column if not exists free_tools text[];
alter table public.project_templates add column if not exists run_instructions text;
alter table public.project_templates add column if not exists starter_code jsonb;

create index if not exists project_templates_slug_idx on public.project_templates(slug);

drop policy if exists "project_templates_public_read" on public.project_templates;
create policy "project_templates_public_read"
  on public.project_templates for select
  to public
  using (true);
