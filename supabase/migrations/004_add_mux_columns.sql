-- Migration: 004_add_mux_columns
-- Description: Add Mux-related columns to videos table

ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS mux_asset_id TEXT,
ADD COLUMN IF NOT EXISTS mux_playback_id TEXT;

CREATE INDEX IF NOT EXISTS idx_videos_mux_asset_id ON public.videos(mux_asset_id);
