-- Paste into Supabase SQL Editor (run once). Do not add public update policies.
create table if not exists public.download_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);
alter table public.download_members enable row level security;
-- No anon/authenticated table policies: only the server's service-role client can read/write.
create or replace function public.new_download_member()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.download_members (user_id, email, status)
  values (new.id, coalesce(new.email,''), 'pending')
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists after_auth_user_created_downloads on auth.users;
create trigger after_auth_user_created_downloads
after insert on auth.users
for each row execute function public.new_download_member();
