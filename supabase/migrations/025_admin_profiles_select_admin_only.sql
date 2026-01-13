-- Migration: 025_admin_profiles_select_admin_only
-- Description: restrict full profile visibility to admins only
-- Date: 2026-01-02

BEGIN;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'
    )
  );

COMMIT;
