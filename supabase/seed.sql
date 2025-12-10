-- Seed data for Bob University
-- Run this in the Supabase SQL Editor

-- Insert sample modules
INSERT INTO public.modules (id, title, description, thumbnail_url, sort_order, is_published) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Fundamentals of Hair Cutting', 'Master the essential techniques every stylist needs to know. From basic scissor work to understanding hair texture and growth patterns.', NULL, 1, true),
  ('22222222-2222-2222-2222-222222222222', 'Color Theory & Application', 'Understand color science and learn professional coloring techniques. Perfect for stylists looking to expand their color services.', NULL, 2, true),
  ('33333333-3333-3333-3333-333333333333', 'Advanced Styling Techniques', 'Take your styling skills to the next level with advanced blowout, updo, and finishing techniques.', NULL, 3, true),
  ('44444444-4444-4444-4444-444444444444', 'Business & Client Relations', 'Build a thriving career with proven business strategies and client communication techniques.', NULL, 4, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample videos for Module 1: Fundamentals
INSERT INTO public.videos (id, module_id, title, description, video_url, duration_seconds, sort_order, is_free, is_published) VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Introduction to Hair Cutting', 'Welcome to the course! Learn what to expect and prepare your tools.', 'https://placeholder.mux.com/video1.m3u8', 300, 1, true, true),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Understanding Hair Types', 'Learn about different hair textures and how they affect cutting techniques.', 'https://placeholder.mux.com/video2.m3u8', 480, 2, true, true),
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Basic Scissor Techniques', 'Master the fundamental scissor holds and cutting motions.', 'https://placeholder.mux.com/video3.m3u8', 720, 3, false, true),
  ('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Sectioning & Parting', 'Learn professional sectioning methods for consistent results.', 'https://placeholder.mux.com/video4.m3u8', 600, 4, false, true),
  ('a5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'The Classic Bob Cut', 'Step-by-step guide to executing a perfect bob haircut.', 'https://placeholder.mux.com/video5.m3u8', 900, 5, false, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample videos for Module 2: Color Theory
INSERT INTO public.videos (id, module_id, title, description, video_url, duration_seconds, sort_order, is_free, is_published) VALUES
  ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Color Wheel Basics', 'Understanding the color wheel and how colors interact.', 'https://placeholder.mux.com/color1.m3u8', 420, 1, true, true),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Level & Tone System', 'Master the professional level and tone numbering system.', 'https://placeholder.mux.com/color2.m3u8', 540, 2, false, true),
  ('b3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Formulation Basics', 'Learn to create custom color formulas for any client.', 'https://placeholder.mux.com/color3.m3u8', 660, 3, false, true),
  ('b4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Application Techniques', 'Professional application methods for consistent results.', 'https://placeholder.mux.com/color4.m3u8', 780, 4, false, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample videos for Module 3: Advanced Styling
INSERT INTO public.videos (id, module_id, title, description, video_url, duration_seconds, sort_order, is_free, is_published) VALUES
  ('c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Professional Blowout Techniques', 'Create salon-quality blowouts every time.', 'https://placeholder.mux.com/style1.m3u8', 600, 1, true, true),
  ('c2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Curling Iron Mastery', 'Perfect your curling techniques for all hair types.', 'https://placeholder.mux.com/style2.m3u8', 720, 2, false, true),
  ('c3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Updos for Every Occasion', 'Learn versatile updo techniques for various events.', 'https://placeholder.mux.com/style3.m3u8', 900, 3, false, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample videos for Module 4: Business
INSERT INTO public.videos (id, module_id, title, description, video_url, duration_seconds, sort_order, is_free, is_published) VALUES
  ('d1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Building Your Brand', 'Create a personal brand that attracts ideal clients.', 'https://placeholder.mux.com/biz1.m3u8', 480, 1, true, true),
  ('d2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Client Consultation Best Practices', 'Master the art of the consultation for happier clients.', 'https://placeholder.mux.com/biz2.m3u8', 540, 2, false, true),
  ('d3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Pricing Your Services', 'Learn to price your services confidently and profitably.', 'https://placeholder.mux.com/biz3.m3u8', 420, 3, false, true)
ON CONFLICT (id) DO NOTHING;
