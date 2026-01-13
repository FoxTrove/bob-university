-- Add poster_url and promo_video_url to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS poster_url text,
ADD COLUMN IF NOT EXISTS promo_video_url text;
