-- Ensure the existing site owner retains access after role-table or auth changes.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('Sohel.Islam@ibm.com')
ON CONFLICT (user_id, role) DO NOTHING;
