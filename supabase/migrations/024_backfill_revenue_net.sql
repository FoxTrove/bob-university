-- Migration: 024_backfill_revenue_net
-- Description: backfill net revenue fields
-- Date: 2026-01-02

UPDATE public.revenue_ledger
SET net_cents = amount_cents - COALESCE(fee_cents, 0)
WHERE net_cents = 0;
