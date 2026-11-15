create table if not exists public.finance_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{"transactions":[],"budgets":[],"goals":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.finance_data enable row level security;

revoke all on table public.finance_data from anon, authenticated;
grant select, insert, update, delete on table public.finance_data to authenticated;

drop policy if exists "Users manage their own finance data" on public.finance_data;
create policy "Users manage their own finance data"
  on public.finance_data
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
