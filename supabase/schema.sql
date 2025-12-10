-- Bob University Database Schema
-- Execute this file in Supabase SQL Editor or via CLI

-- =====================================================
-- 1. PROFILES TABLE (extends auth.users)
-- =====================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'individual' CHECK (role IN ('individual', 'salon_owner', 'staff', 'admin')),
  salon_id UUID,
  years_experience INTEGER,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. SALONS TABLE
-- =====================================================

CREATE TABLE public.salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_staff INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to profiles after salons exists
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_salon FOREIGN KEY (salon_id) REFERENCES public.salons(id) ON DELETE SET NULL;

ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can view own salon" ON public.salons FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Salon owners can update own salon" ON public.salons FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can create salons" ON public.salons FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- =====================================================
-- 3. ENTITLEMENTS TABLE (unified access control)
-- =====================================================

CREATE TABLE public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'individual', 'salon')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entitlement" ON public.entitlements FOR SELECT USING (auth.uid() = user_id);

-- Trigger to auto-create free entitlement on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.entitlements (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- =====================================================
-- 4. PURCHASES TABLE (Apple IAP and Stripe)
-- =====================================================

CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('apple', 'stripe')),
  product_type TEXT NOT NULL CHECK (product_type IN ('subscription', 'certification', 'event', 'merch')),
  product_id TEXT NOT NULL,
  external_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  amount_cents INTEGER,
  currency TEXT DEFAULT 'USD',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 5. MODULES TABLE (course organization)
-- =====================================================

CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published modules" ON public.modules FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- 6. VIDEOS TABLE
-- =====================================================

CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published videos metadata" ON public.videos FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admins can manage videos" ON public.videos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- 7. VIDEO_PROGRESS TABLE
-- =====================================================

CREATE TABLE public.video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  watched_seconds INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.video_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.video_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.video_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 8. PUSH_TOKENS TABLE (for notifications)
-- =====================================================

CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens" ON public.push_tokens FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX idx_profiles_salon_id ON public.profiles(salon_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Entitlements indexes
CREATE INDEX idx_entitlements_user_id ON public.entitlements(user_id);
CREATE INDEX idx_entitlements_status ON public.entitlements(status);

-- Purchases indexes
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_source ON public.purchases(source);
CREATE INDEX idx_purchases_external_id ON public.purchases(external_id);

-- Modules indexes
CREATE INDEX idx_modules_published ON public.modules(is_published);
CREATE INDEX idx_modules_sort_order ON public.modules(sort_order);

-- Videos indexes
CREATE INDEX idx_videos_module_id ON public.videos(module_id);
CREATE INDEX idx_videos_published ON public.videos(is_published);
CREATE INDEX idx_videos_sort_order ON public.videos(sort_order);

-- Video progress indexes
CREATE INDEX idx_video_progress_user_id ON public.video_progress(user_id);
CREATE INDEX idx_video_progress_video_id ON public.video_progress(video_id);
CREATE INDEX idx_video_progress_completed ON public.video_progress(completed);

-- Push tokens indexes
CREATE INDEX idx_push_tokens_user_id ON public.push_tokens(user_id);
