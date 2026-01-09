-- Drop the existing constraint
ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;

-- Re-add the constraint with 'owner' added to the allowed values
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('individual', 'salon_owner', 'staff', 'admin', 'owner'));
