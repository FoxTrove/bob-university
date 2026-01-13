-- Seed Stylist Profiles for Map Testing
-- Fix: Use valid role 'staff' (constraint: individual, salon_owner, staff, admin)

-- 1. Upsert into public.profiles
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
    '292105a2-aa45-4612-8b52-c6d3e58bd024',
    'michael.cuts@example.com',
    'Michael Cuts',
    'staff'
) ON CONFLICT (id) DO UPDATE SET role = 'staff';

INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
    '3f58442a-9b9a-43b8-9ea6-6e31e7fe513d',
    'sarah.chic@example.com',
    'Sarah Chic',
    'staff'
) ON CONFLICT (id) DO UPDATE SET role = 'staff';

INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
    '6d1adf67-e2ea-4659-b5df-13f6c3cea5d8',
    'jessica.style@example.com',
    'Jessica Style',
    'staff'
) ON CONFLICT (id) DO UPDATE SET role = 'staff';


-- 2. Insert into stylist_profiles
INSERT INTO stylist_profiles (
    user_id,
    display_name,
    bio,
    salon_name,
    city,
    state,
    country,
    latitude,
    longitude,
    is_public,
    profile_photo_url,
    instagram_handle
) VALUES
(
    '6d1adf67-e2ea-4659-b5df-13f6c3cea5d8', -- User 1
    'Jessica Style (NY)',
    'Expert in color and cuts in the heart of NYC.',
    'Test Salon NYC',
    'New York',
    'NY',
    'USA',
    40.7128,
    -74.0060,
    true,
    'https://randomuser.me/api/portraits/women/44.jpg',
    '@jessstyle_nyc'
),
(
    '292105a2-aa45-4612-8b52-c6d3e58bd024', -- User 2
    'Michael Cuts (LA)',
    'Celebrity stylist in Los Angeles.',
    'Test Salon LA',
    'Los Angeles',
    'CA',
    'USA',
    34.0522,
    -118.2437,
    true,
    'https://randomuser.me/api/portraits/men/32.jpg',
    '@mike_cuts_la'
),
(
    '3f58442a-9b9a-43b8-9ea6-6e31e7fe513d', -- User 3
    'Sarah Chic (Chicago)',
    'Modern styling for the modern woman.',
    'Test Salon Chicago',
    'Chicago',
    'IL',
    'USA',
    41.8781,
    -87.6298,
    true,
    'https://randomuser.me/api/portraits/women/68.jpg',
    '@sarahchic_chi'
)
ON CONFLICT (user_id) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    is_public = EXCLUDED.is_public,
    display_name = EXCLUDED.display_name;
