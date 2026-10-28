create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'employee' check (role in ('employee', 'manager', 'authority')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.current_user_role() in ('manager', 'authority'));

create policy "Only authorities can create profiles"
on public.profiles for insert
to authenticated
with check (public.current_user_role() = 'authority');

create policy "Only authorities can update profiles"
on public.profiles for update
to authenticated
using (public.current_user_role() = 'authority')
with check (role in ('employee', 'manager', 'authority'));

create table if not exists public.portal_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id),
  action text not null,
  target_id uuid,
  created_at timestamptz not null default now()
);

alter table public.portal_audit_log enable row level security;

create policy "Authorities can read audit logs"
on public.portal_audit_log for select
to authenticated
using (public.current_user_role() = 'authority');
