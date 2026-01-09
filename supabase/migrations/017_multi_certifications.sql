-- =====================================================
-- Bob University - Multi Certification Support
-- Migration: 017_multi_certifications
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.certification_settings) THEN
    INSERT INTO public.certification_settings (title, description)
    VALUES (
      'Ray-Certified Stylist',
      'Certified and approved by Ray in his methods. This certification demonstrates mastery of Ray''s cutting techniques and his confidence in endorsing your skills.'
    );
  END IF;
END $$;

ALTER TABLE public.certification_required_modules
  ADD COLUMN IF NOT EXISTS certification_id UUID REFERENCES public.certification_settings(id) ON DELETE CASCADE;

UPDATE public.certification_required_modules
  SET certification_id = (SELECT id FROM public.certification_settings ORDER BY created_at LIMIT 1)
  WHERE certification_id IS NULL;

ALTER TABLE public.certification_required_modules
  ALTER COLUMN certification_id SET NOT NULL;

ALTER TABLE public.certification_required_modules
  DROP CONSTRAINT IF EXISTS certification_required_modules_module_id_key;

ALTER TABLE public.certification_required_modules
  ADD CONSTRAINT certification_required_modules_cert_module_key UNIQUE (certification_id, module_id);

CREATE INDEX IF NOT EXISTS idx_certification_required_modules_cert_id
  ON public.certification_required_modules(certification_id);

ALTER TABLE public.user_certifications
  ADD COLUMN IF NOT EXISTS certification_id UUID REFERENCES public.certification_settings(id) ON DELETE CASCADE;

UPDATE public.user_certifications
  SET certification_id = (SELECT id FROM public.certification_settings ORDER BY created_at LIMIT 1)
  WHERE certification_id IS NULL;

ALTER TABLE public.user_certifications
  ALTER COLUMN certification_id SET NOT NULL;

ALTER TABLE public.user_certifications
  DROP CONSTRAINT IF EXISTS user_certifications_user_id_key;

ALTER TABLE public.user_certifications
  ADD CONSTRAINT user_certifications_user_cert_key UNIQUE (user_id, certification_id);

CREATE INDEX IF NOT EXISTS idx_user_certifications_cert_id
  ON public.user_certifications(certification_id);
