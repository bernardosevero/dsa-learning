-- One row per user holding the whole log: the app never queries entries server-side.
create table public.saves (
  user_id    uuid primary key default auth.uid() references auth.users on delete cascade,
  entries    jsonb not null,
  settings   jsonb not null,
  version    int not null default 1,
  updated_at timestamptz not null default now()
);

-- The publishable key ships in the bundle, so these policies are the only protection.
alter table public.saves enable row level security;

create policy "Users read their own save"
  on public.saves for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users create their own save"
  on public.saves for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users update their own save"
  on public.saves for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- No delete policy: a save goes only with its account, through delete_my_account().
revoke all on public.saves from anon;

-- Deletes the caller's user; their saves row goes by cascade.
create function public.delete_my_account()
  returns void
  language sql
  security definer
  set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
