-- Migration: 023_revenue_ledger_fees
-- Description: add fee + net revenue fields
-- Date: 2026-01-02

ALTER TABLE public.revenue_ledger
  ADD COLUMN IF NOT EXISTS fee_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_cents INTEGER DEFAULT 0;
