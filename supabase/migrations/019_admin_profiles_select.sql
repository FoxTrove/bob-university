-- Migration: 019_admin_profiles_select
-- Description: allow admins/owners to view all profiles
-- Date: 2026-01-02

BEGIN;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

COMMIT;
