-- Add email invite columns to staff_access_codes
ALTER TABLE public.staff_access_codes
ADD COLUMN invited_email TEXT,
ADD COLUMN invite_sent_at TIMESTAMPTZ;

-- Add index for looking up codes by invited email
CREATE INDEX idx_staff_access_codes_invited_email
ON public.staff_access_codes(invited_email)
WHERE invited_email IS NOT NULL;
