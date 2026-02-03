-- Migration: Add user_type to profiles and new subscription plans
-- Date: 2026-02-03

-- Add user_type column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS user_type TEXT
CHECK (user_type IN ('salon_owner', 'individual_stylist', 'client'));

-- Add comment for documentation
COMMENT ON COLUMN profiles.user_type IS 'User type selected during onboarding: salon_owner, individual_stylist, or client';

-- Create index for user_type queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Update existing users to individual_stylist as default (for stylists who signed up before this change)
-- Only update users who have completed onboarding and don't have a salon_id
UPDATE profiles
SET user_type = 'individual_stylist'
WHERE user_type IS NULL
  AND has_completed_onboarding = true
  AND salon_id IS NULL;

-- Update salon owners (users with salon_id set)
UPDATE profiles
SET user_type = 'salon_owner'
WHERE user_type IS NULL
  AND salon_id IS NOT NULL;

-- Note: Subscription plan updates should be done via the admin dashboard
-- or through the update-plan-pricing edge function to ensure Stripe sync.
-- The following is documentation of the new pricing structure:
--
-- SIGNATURE plan: $69/month (replaces 'individual' at $49)
-- - Core curriculum & vault
-- - Monthly live workshop
-- - Celebrity cut breakdown
-- - Full community access
-- - Stylist directory listing
-- - Certification eligible ($297)
--
-- STUDIO plan: $149/month (new tier)
-- - Everything in Signature
-- - Weekly "Ask Ray" live sessions
-- - Demand (business/pricing content)
-- - Studio-only replays
-- - Reserved seats at live events
-- - Certification eligible ($297)
--
-- SALON plan: $150/month or $997/year (was $97/month)
-- - 5 team seats included
-- - All Signature + Studio content
-- - Team progress dashboard
-- - ~30% off certifications
-- - Reserved event seats for team
-- - Priority support
