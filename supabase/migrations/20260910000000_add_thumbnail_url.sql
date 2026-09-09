alter table public.images add column if not exists thumbnail_url text;
comment on column public.images.thumbnail_url is 'Small WebP derivative used by image grids; the original image_url is used for detail views.';
create index if not exists images_thumbnail_url_idx on public.images (thumbnail_url) where thumbnail_url is null;
