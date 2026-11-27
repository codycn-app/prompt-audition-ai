-- ============================================================================
-- Migration: Add hashtags column for 5-topic AI tagging + search index
-- Run once in Supabase Dashboard > SQL Editor
-- ============================================================================

alter table public.images
add column if not exists hashtags text[] not null default '{}'::text[];

create index if not exists idx_images_hashtags_gin
on public.images using gin (hashtags);
