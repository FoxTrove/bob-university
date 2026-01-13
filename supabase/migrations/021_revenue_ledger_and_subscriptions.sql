-- Migration: 021_revenue_ledger_and_subscriptions
-- Description: revenue ledger + subscription records for admin analytics
-- Date: 2026-01-02

BEGIN;

CREATE TABLE IF NOT EXISTS public.revenue_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('stripe', 'apple', 'google', 'manual')),
  platform TEXT CHECK (platform IN ('ios', 'android', 'web', 'unknown')) DEFAULT 'unknown',
  product_type TEXT NOT NULL CHECK (product_type IN ('subscription', 'event', 'certification', 'other')),
  plan TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'refunded', 'failed')),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  external_id TEXT,
  payment_intent_id TEXT,
  charge_id TEXT,
  subscription_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.revenue_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view revenue ledger" ON public.revenue_ledger;
CREATE POLICY "Admins can view revenue ledger"
  ON public.revenue_ledger
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage revenue ledger" ON public.revenue_ledger;
CREATE POLICY "Admins can manage revenue ledger"
  ON public.revenue_ledger
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_revenue_ledger_occurred_at ON public.revenue_ledger(occurred_at);
CREATE INDEX IF NOT EXISTS idx_revenue_ledger_source ON public.revenue_ledger(source);
CREATE INDEX IF NOT EXISTS idx_revenue_ledger_product_type ON public.revenue_ledger(product_type);
CREATE INDEX IF NOT EXISTS idx_revenue_ledger_status ON public.revenue_ledger(status);

CREATE TABLE IF NOT EXISTS public.subscription_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('stripe', 'apple', 'google', 'manual')),
  external_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'past_due', 'canceled', 'expired')),
  plan TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  paused_at TIMESTAMPTZ,
  provider_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscription_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage subscription records" ON public.subscription_records;
CREATE POLICY "Admins can manage subscription records"
  ON public.subscription_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS subscription_records_user_source_idx
  ON public.subscription_records(user_id, source);

CREATE UNIQUE INDEX IF NOT EXISTS subscription_records_source_external_idx
  ON public.subscription_records(source, external_id);

COMMIT;
