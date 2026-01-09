-- Create staff_access_codes table
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.staff_access_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    max_uses INTEGER DEFAULT 5,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_access_codes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Owners can view their own codes" 
ON public.staff_access_codes FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create codes" 
ON public.staff_access_codes FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own codes" 
ON public.staff_access_codes FOR DELETE 
USING (auth.uid() = owner_id);

-- Add triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.staff_access_codes
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
