-- Migration: 020_admin_role_rpc
-- Description: helper to read role for admin middleware
-- Date: 2026-01-02

BEGIN;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

COMMIT;
