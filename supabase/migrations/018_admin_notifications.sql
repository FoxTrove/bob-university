-- Migration: 018_admin_notifications
-- Description: add notification campaigns + admin policies for entitlements/tokens
-- Date: 2026-01-02

BEGIN;

CREATE TABLE IF NOT EXISTS public.notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  deep_link TEXT,
  audience TEXT NOT NULL CHECK (audience IN ('all', 'subscribers', 'free')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage notification campaigns" ON public.notification_campaigns;
CREATE POLICY "Admins can manage notification campaigns"
  ON public.notification_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Admins can view push tokens" ON public.push_tokens;
CREATE POLICY "Admins can view push tokens"
  ON public.push_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Admins can manage entitlements" ON public.entitlements;
CREATE POLICY "Admins can manage entitlements"
  ON public.entitlements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

COMMIT;
