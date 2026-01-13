-- Migration: Add text-only support to videos table
-- Description: Adds 'type' and 'text_content' columns, makes 'video_url' nullable
-- Author: Antigravity
-- Date: 2025-12-15

-- Up Migration
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('video', 'text')) DEFAULT 'video',
ADD COLUMN IF NOT EXISTS text_content TEXT;

ALTER TABLE public.videos 
ALTER COLUMN video_url DROP NOT NULL;

-- Create index for type
CREATE INDEX IF NOT EXISTS idx_videos_type ON public.videos(type);
