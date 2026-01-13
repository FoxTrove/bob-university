-- Migration: 022_backfill_revenue_ledger
-- Description: backfill revenue ledger from purchases
-- Date: 2026-01-02

INSERT INTO public.revenue_ledger (
  user_id,
  source,
  platform,
  product_type,
  plan,
  status,
  amount_cents,
  currency,
  external_id,
  occurred_at,
  metadata
)
SELECT
  purchases.user_id,
  purchases.source::text,
  CASE
    WHEN purchases.source = 'apple' THEN 'ios'
    WHEN purchases.source = 'google' THEN 'android'
    WHEN purchases.source = 'stripe' THEN 'web'
    ELSE 'unknown'
  END AS platform,
  CASE
    WHEN purchases.product_type IN ('subscription', 'event', 'certification') THEN purchases.product_type
    ELSE 'other'
  END AS product_type,
  NULL AS plan,
  COALESCE(purchases.status, 'completed') AS status,
  COALESCE(purchases.amount_cents, 0) AS amount_cents,
  COALESCE(purchases.currency, 'USD') AS currency,
  purchases.external_id,
  purchases.created_at,
  COALESCE(purchases.metadata, '{}'::jsonb)
FROM public.purchases
WHERE NOT EXISTS (
  SELECT 1
  FROM public.revenue_ledger
  WHERE revenue_ledger.external_id = purchases.external_id
    AND revenue_ledger.source = purchases.source
);
