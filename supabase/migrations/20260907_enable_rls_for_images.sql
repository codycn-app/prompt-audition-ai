-- Enable RLS on the two public tables flagged by Supabase Advisor.
-- Apply this migration with the Supabase CLI, or run it once in Dashboard > SQL Editor.

begin;

-- The function is SECURITY DEFINER so policy checks do not depend on the caller
-- being permitted to read every profile. Keep the search path fixed.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.images enable row level security;
alter table public.image_categories enable row level security;

-- The gallery is intentionally public. Write access is restricted to the image
-- owner, except for accounts whose profile role is admin.
drop policy if exists "Public images are viewable by everyone" on public.images;
drop policy if exists "Users can create their own images" on public.images;
drop policy if exists "Users can update their own images" on public.images;
drop policy if exists "Users can delete their own images" on public.images;
drop policy if exists "Authenticated users can create their own images" on public.images;
drop policy if exists "Image owners and admins can update images" on public.images;
drop policy if exists "Image owners and admins can delete images" on public.images;

create policy "Public images are viewable by everyone"
on public.images for select
using (true);

create policy "Authenticated users can create their own images"
on public.images for insert
to authenticated
with check (user_id = auth.uid());

create policy "Image owners and admins can update images"
on public.images for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "Image owners and admins can delete images"
on public.images for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- The image/category relationship is public to read. A caller may change a
-- relationship only for an image they own; admins can manage every image.
drop policy if exists "Public image_categories are viewable by everyone" on public.image_categories;
drop policy if exists "Users can link categories to their images" on public.image_categories;
drop policy if exists "Users can delete links for their own images" on public.image_categories;
drop policy if exists "Image owners and admins can create category links" on public.image_categories;
drop policy if exists "Image owners and admins can delete category links" on public.image_categories;

create policy "Public image_categories are viewable by everyone"
on public.image_categories for select
using (true);

create policy "Image owners and admins can create category links"
on public.image_categories for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1 from public.images
    where images.id = image_categories.image_id
      and images.user_id = auth.uid()
  )
);

create policy "Image owners and admins can delete category links"
on public.image_categories for delete
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.images
    where images.id = image_categories.image_id
      and images.user_id = auth.uid()
  )
);

-- The UI records a view when a gallery card is opened. Do it server-side so a
-- public visitor can change only the counter, never other image fields.
create or replace function public.increment_image_views(p_image_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.images
  set views = coalesce(views, 0) + 1
  where id = p_image_id;
$$;

revoke all on function public.increment_image_views(bigint) from public;
grant execute on function public.increment_image_views(bigint) to anon, authenticated;

commit;
