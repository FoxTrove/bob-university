-- Add skills_assessment column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS skills_assessment JSONB DEFAULT '{}'::jsonb;
