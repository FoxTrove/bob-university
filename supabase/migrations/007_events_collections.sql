-- Migration: 007_events_collections
-- Description: Adds support for Events, Tickets, and Content Collections (PRD v2.0)
-- Author: Antigravity
-- Date: 2025-12-16

-- =====================================================
-- 1. EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT CHECK (event_type IN ('webinar', 'workshop', 'bootcamp', 'meetup')) DEFAULT 'webinar',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    timezone TEXT DEFAULT 'UTC',
    location TEXT, -- Physical address or "Online"
    meeting_url TEXT, -- Zoom/Google Meet link
    price_cents INTEGER DEFAULT 0,
    capacity INTEGER,
    is_published BOOLEAN DEFAULT FALSE,
    host_id UUID REFERENCES public.profiles(id),
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view published events" ON public.events FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON public.events(is_published);

-- =====================================================
-- 2. TICKETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('active', 'cancelled', 'checked_in')) DEFAULT 'active',
    stripe_purchase_id TEXT,
    ticket_code TEXT UNIQUE DEFAULT gen_random_uuid()::text, -- QR Code content
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage tickets" ON public.tickets FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);

-- =====================================================
-- 3. COLLECTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE,
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- If true, viewable by anyone. If false, maybe assignable?
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view public collections" ON public.collections FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Admins can manage collections" ON public.collections FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- 4. COLLECTION_ITEMS TABLE (Many-to-Many Video Link)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collection_id, video_id)
);

-- Enable RLS
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public view collection items" ON public.collection_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.collections WHERE id = collection_id AND is_public = TRUE)
);
CREATE POLICY "Admins can manage collection items" ON public.collection_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON public.collection_items(collection_id);
