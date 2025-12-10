-- =====================================================
-- Bob University - Certifications & Stylist Directory
-- Migration: 002_certifications
-- =====================================================

-- =====================================================
-- 1. CERTIFICATION_SETTINGS TABLE (singleton config)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.certification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Ray-Certified Stylist',
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 29700,
  badge_image_url TEXT,
  requires_review BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.certification_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view certification settings" ON public.certification_settings;
DROP POLICY IF EXISTS "Admins can manage certification settings" ON public.certification_settings;

-- Create policies
CREATE POLICY "Anyone can view certification settings" ON public.certification_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage certification settings" ON public.certification_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert default certification settings row
INSERT INTO public.certification_settings (title, description)
VALUES ('Ray-Certified Stylist', 'Certified and approved by Ray in his methods. This certification demonstrates mastery of Ray''s cutting techniques and his confidence in endorsing your skills.')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. CERTIFICATION_REQUIRED_MODULES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.certification_required_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.certification_required_modules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view required modules" ON public.certification_required_modules;
DROP POLICY IF EXISTS "Admins can manage required modules" ON public.certification_required_modules;

-- Create policies
CREATE POLICY "Anyone can view required modules" ON public.certification_required_modules
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage required modules" ON public.certification_required_modules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- 3. USER_CERTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- purchased, awaiting submission
    'submitted',    -- video submitted, awaiting review
    'approved',     -- passed review (Ray-Certified!)
    'rejected',     -- failed review
    'resubmitted'   -- second attempt submitted
  )),
  submission_video_url TEXT,
  feedback TEXT,
  attempt_number INTEGER DEFAULT 1,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own certification" ON public.user_certifications;
DROP POLICY IF EXISTS "Users can update own certification" ON public.user_certifications;
DROP POLICY IF EXISTS "Users can insert own certification" ON public.user_certifications;
DROP POLICY IF EXISTS "Admins can manage all certifications" ON public.user_certifications;

-- Create policies
CREATE POLICY "Users can view own certification" ON public.user_certifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own certification" ON public.user_certifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certification" ON public.user_certifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all certifications" ON public.user_certifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- 4. STYLIST_PROFILES TABLE (Directory)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stylist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_photo_url TEXT,
  salon_name TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  contact_email TEXT,
  phone TEXT,
  instagram_handle TEXT,
  booking_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stylist_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by anyone" ON public.stylist_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.stylist_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.stylist_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.stylist_profiles;
DROP POLICY IF EXISTS "Admins can manage all stylist profiles" ON public.stylist_profiles;

-- Create policies
CREATE POLICY "Public profiles are viewable by anyone" ON public.stylist_profiles
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can view own profile" ON public.stylist_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.stylist_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.stylist_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all stylist profiles" ON public.stylist_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User certifications indexes
CREATE INDEX IF NOT EXISTS idx_user_certifications_user_id ON public.user_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_certifications_status ON public.user_certifications(status);
CREATE INDEX IF NOT EXISTS idx_user_certifications_submitted_at ON public.user_certifications(submitted_at);

-- Stylist profiles indexes
CREATE INDEX IF NOT EXISTS idx_stylist_profiles_user_id ON public.stylist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_stylist_profiles_is_public ON public.stylist_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_stylist_profiles_city_state ON public.stylist_profiles(city, state);
CREATE INDEX IF NOT EXISTS idx_stylist_profiles_location ON public.stylist_profiles(latitude, longitude);

-- Certification required modules indexes
CREATE INDEX IF NOT EXISTS idx_certification_required_modules_module_id ON public.certification_required_modules(module_id);

-- =====================================================
-- STORAGE BUCKET FOR CERTIFICATION SUBMISSIONS
-- =====================================================

-- Note: Run this in the Supabase dashboard or via the API:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('certification-submissions', 'certification-submissions', false);
