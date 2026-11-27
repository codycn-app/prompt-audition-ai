-- ============================================================================
-- Migration: Smart Views (+1000..2000 base & daily 10..20) + App CMS Settings
-- Run once in Supabase Dashboard > SQL Editor
-- ============================================================================

begin;

-- 1. App Settings table (stores Support QR/info, Welcome Noti, Private IDs, and daily view sync date)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "Public can read app_settings" on public.app_settings;
create policy "Public can read app_settings"
on public.app_settings for select
using (true);

drop policy if exists "Admins can manage app_settings" on public.app_settings;
create policy "Admins can manage app_settings"
on public.app_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 2. One-time random boost (+1000 to +2000 views) added onto existing image views
-- Protected by a flag in app_settings so running this script multiple times never double-counts!
do $$
begin
  if not exists (select 1 from public.app_settings where key = 'initial_view_boost_applied') then
    update public.images
    set views = coalesce(views, 0) + (1000 + floor(random() * 1001)::int);

    insert into public.app_settings (key, value)
    values (
      'initial_view_boost_applied',
      jsonb_build_object('applied_at', now(), 'min', 1000, 'max', 2000)
    );
  end if;
end $$;

-- 3. Atomic once-per-day Smart View Increment (10..20 random views per image per day)
-- Each image gets its own distinct random increment between 10 and 20, persisted in public.images.views.
create or replace function public.sync_daily_views()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today text := to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD');
  v_last text;
begin
  -- Advisory lock prevents race conditions if two visitors open the app at midnight simultaneously
  perform pg_advisory_xact_lock(982451653);

  select value->>'date' into v_last
  from public.app_settings
  where key = 'last_daily_view_sync';

  if v_last = v_today then
    return false;
  end if;

  update public.images
  set views = coalesce(views, 0) + (10 + floor(random() * 11)::int);

  insert into public.app_settings (key, value, updated_at)
  values ('last_daily_view_sync', jsonb_build_object('date', v_today), now())
  on conflict (key) do update
    set value = excluded.value,
        updated_at = now();

  return true;
end;
$$;

revoke all on function public.sync_daily_views() from public;
grant execute on function public.sync_daily_views() to anon, authenticated;

commit;
