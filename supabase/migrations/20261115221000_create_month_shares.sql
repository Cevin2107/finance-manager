create extension if not exists pgcrypto with schema extensions;

create table if not exists public.month_shares (
  token text primary key check (token ~ '^[0-9a-f]{32}$'),
  owner_id uuid not null references auth.users (id) on delete cascade,
  password_hash text not null,
  month smallint not null check (month between 1 and 12),
  year smallint not null check (year between 2000 and 9999),
  transactions jsonb not null check (jsonb_typeof(transactions) = 'array'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz
);

alter table public.month_shares enable row level security;
revoke all on table public.month_shares from public, anon, authenticated;

create or replace function public.create_month_share(
  p_token text,
  p_password text,
  p_month smallint,
  p_year smallint,
  p_transactions jsonb,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
begin
  if v_owner_id is null then
    raise exception 'Authentication required';
  end if;
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then
    raise exception 'Invalid share token';
  end if;
  if p_password is null or p_password !~ '^[0-9]{6}$' then
    raise exception 'Share password must contain six digits';
  end if;
  if p_month is null or p_month not between 1 and 12 or p_year is null or p_year not between 2000 and 9999 then
    raise exception 'Invalid month';
  end if;
  if p_transactions is null or jsonb_typeof(p_transactions) <> 'array' then
    raise exception 'Transactions must be a JSON array';
  end if;
  if p_expires_at is null
    or p_expires_at <= statement_timestamp()
    or p_expires_at > statement_timestamp() + interval '30 days' then
    raise exception 'Invalid expiration time';
  end if;

  insert into public.month_shares (
    token,
    owner_id,
    password_hash,
    month,
    year,
    transactions,
    expires_at
  )
  values (
    p_token,
    v_owner_id,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    p_month,
    p_year,
    p_transactions,
    p_expires_at
  );
end;
$$;

revoke all on function public.create_month_share(text, text, smallint, smallint, jsonb, timestamptz) from public, anon;
grant execute on function public.create_month_share(text, text, smallint, smallint, jsonb, timestamptz) to authenticated;

create or replace function public.get_month_share(
  p_token text,
  p_password text
)
returns table (
  month smallint,
  year smallint,
  transactions jsonb,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_share public.month_shares%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then
    return;
  end if;

  select share.*
  into v_share
  from public.month_shares as share
  where share.token = p_token
    and share.expires_at > statement_timestamp()
  for update;

  if not found or v_share.locked_until > statement_timestamp() then
    return;
  end if;

  if p_password is not null
    and p_password ~ '^[0-9]{6}$'
    and v_share.password_hash = extensions.crypt(p_password, v_share.password_hash) then
    update public.month_shares
    set failed_attempts = 0,
        locked_until = null
    where token = p_token;

    return query
      select v_share.month, v_share.year, v_share.transactions, v_share.expires_at;
    return;
  end if;

  update public.month_shares
  set failed_attempts = failed_attempts + 1,
      locked_until = case
        when failed_attempts + 1 >= 10 then statement_timestamp() + interval '15 minutes'
        else null
      end
  where token = p_token;
end;
$$;

revoke all on function public.get_month_share(text, text) from public;
grant execute on function public.get_month_share(text, text) to anon, authenticated;
