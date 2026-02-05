-- Create retention_offers table to track retention offers given to users
-- This prevents users from receiving multiple retention offers
CREATE TABLE retention_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_type VARCHAR(50) NOT NULL DEFAULT 'two_months_free',
  reason VARCHAR(100),
  stripe_coupon_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  free_until TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_offer_type CHECK (offer_type IN ('two_months_free', 'three_months_free', 'one_month_free', 'discount')),
  UNIQUE(user_id)
);

-- Add index for user lookups
CREATE INDEX idx_retention_offers_user_id ON retention_offers(user_id);

-- Add retention_offer_applied column to entitlements if it doesn't exist
ALTER TABLE entitlements ADD COLUMN IF NOT EXISTS retention_offer_applied BOOLEAN DEFAULT FALSE;

-- Enable RLS
ALTER TABLE retention_offers ENABLE ROW LEVEL SECURITY;

-- Users can view their own retention offer
CREATE POLICY "Users can view own retention offer"
  ON retention_offers
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can manage all retention offers
CREATE POLICY "Service role can manage retention offers"
  ON retention_offers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE retention_offers IS 'Tracks retention offers given to users attempting to cancel. Each user can only receive one retention offer.';
COMMENT ON COLUMN retention_offers.offer_type IS 'Type of retention offer: two_months_free, three_months_free, one_month_free, discount';
COMMENT ON COLUMN retention_offers.reason IS 'The cancellation reason the user selected when they received the offer';
