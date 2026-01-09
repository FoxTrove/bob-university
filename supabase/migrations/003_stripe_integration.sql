-- Migration: 003_stripe_integration
-- Purpose: Add Stripe linking columns to profiles and events tables

-- 1. Add stripe_customer_id to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
    CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
  END IF;
END $$;

-- 2. Create events table if not exists (ensure Schema sync)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  event_end_date TIMESTAMPTZ,
  location TEXT,
  venue_name TEXT,
  venue_address TEXT,
  max_capacity INTEGER,
  price_cents INTEGER DEFAULT 0,
  early_bird_price_cents INTEGER,
  early_bird_deadline TIMESTAMPTZ,
  collection_id UUID, -- Optional link to a collection
  is_published BOOLEAN DEFAULT FALSE,
  registration_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add Stripe linking columns to events table for Admin Sync
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'stripe_product_id'
    ) THEN
        ALTER TABLE public.events ADD COLUMN stripe_product_id TEXT;
        ALTER TABLE public.events ADD COLUMN stripe_price_id TEXT;
    END IF;
END $$;

-- 4. Enable RLS on events if newly created (safe to run again)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 5. Policies for events (Admins manage, Everyone views published)
DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;
CREATE POLICY "Anyone can view published events" ON public.events
    FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage events" ON public.events
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
