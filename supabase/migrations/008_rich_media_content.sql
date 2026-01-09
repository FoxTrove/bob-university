-- Migration: 008_rich_media_content
-- Description: Adds jsonb content column for Rich Media Lessons (Blocks)
-- Author: Antigravity
-- Date: 2025-12-16

-- Add structured content column to videos table
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS content_json JSONB DEFAULT '[]'::jsonb;

-- Comment: content_json will store an array of blocks, e.g.:
-- [
--   { "type": "text", "content": "..." },
--   { "type": "image", "url": "...", "caption": "..." },
--   { "type": "video", "mux_asset_id": "..." }
-- ]
