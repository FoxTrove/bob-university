-- Migration: 029_salon_invites
-- Description: Create salon_invites table for in-app invitations to existing users
-- Date: 2026-02-04

BEGIN;

-- Table for in-app invite notifications to existing users
CREATE TABLE IF NOT EXISTS public.salon_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  invited_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  access_code_id UUID REFERENCES public.staff_access_codes(id) ON DELETE SET NULL,
  message TEXT,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, invited_user_id, status) -- Prevent duplicate pending invites
);

-- Add comment
COMMENT ON TABLE public.salon_invites IS 'Stores in-app invitations sent to existing users to join a salon team.';

-- Enable RLS
ALTER TABLE public.salon_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Invited users can view their own invites
CREATE POLICY "Users can view their own invites"
  ON public.salon_invites
  FOR SELECT
  USING (invited_user_id = auth.uid());

-- Policy: Salon owners can view invites they sent
CREATE POLICY "Salon owners can view sent invites"
  ON public.salon_invites
  FOR SELECT
  USING (invited_by_user_id = auth.uid());

-- Policy: Salon owners can create invites for their salon
CREATE POLICY "Salon owners can create invites"
  ON public.salon_invites
  FOR INSERT
  WITH CHECK (
    invited_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.salons
      WHERE id = salon_id AND owner_id = auth.uid()
    )
  );

-- Policy: Invited users can update their own invites (accept/decline)
CREATE POLICY "Users can respond to their invites"
  ON public.salon_invites
  FOR UPDATE
  USING (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid());

-- Policy: Salon owners can update/cancel invites they sent
CREATE POLICY "Salon owners can manage sent invites"
  ON public.salon_invites
  FOR UPDATE
  USING (invited_by_user_id = auth.uid());

-- Index for fast lookup by invited user (for notification badge)
CREATE INDEX idx_salon_invites_invited_user_pending
  ON public.salon_invites(invited_user_id)
  WHERE status = 'pending';

-- Index for fast lookup by salon
CREATE INDEX idx_salon_invites_salon_id
  ON public.salon_invites(salon_id);

-- Function to check if user has pending invites (for notification badge)
CREATE OR REPLACE FUNCTION public.get_pending_salon_invites_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.salon_invites
    WHERE invited_user_id = user_uuid
      AND status = 'pending'
      AND expires_at > NOW()
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_pending_salon_invites_count(UUID) TO authenticated;

COMMIT;
