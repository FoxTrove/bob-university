-- Migration: Create video_library table and Refactor videos
-- Description: Decouples raw video assets from lessons
-- Author: Antigravity
-- Date: 2025-12-15

-- 1. Create the video_library table
CREATE TABLE IF NOT EXISTS public.video_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL, -- Internal reference title
    filename TEXT,
    mux_asset_id TEXT UNIQUE, -- Allow lookup by asset ID
    mux_playback_id TEXT,
    duration_seconds INTEGER,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add foreign key to videos table
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS video_library_id UUID REFERENCES public.video_library(id) ON DELETE SET NULL;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_videos_video_library_id ON public.videos(video_library_id);
