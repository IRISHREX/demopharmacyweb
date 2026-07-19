
-- ============ Careers / Job vacancies ============
CREATE TABLE public.job_vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  employment_type TEXT,
  description TEXT,
  requirements TEXT,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.job_vacancies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_vacancies TO authenticated;
GRANT ALL ON public.job_vacancies TO service_role;

ALTER TABLE public.job_vacancies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view open vacancies"
  ON public.job_vacancies FOR SELECT
  USING (is_open = TRUE OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage vacancies"
  ON public.job_vacancies FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_job_vacancies_updated
  BEFORE UPDATE ON public.job_vacancies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed a few sample vacancies
INSERT INTO public.job_vacancies (slug, title, department, location, employment_type, description, requirements) VALUES
  ('medical-representative-kolkata', 'Medical Representative', 'Sales', 'Kolkata, WB', 'Full-time',
   'Promote Zaxia Healthcare products to doctors, hospitals and pharmacies across Kolkata.',
   'Graduate in Life Sciences/Pharmacy; 0-2 years experience; strong communication skills.'),
  ('qc-analyst', 'QC Analyst', 'Quality Control', 'Kolkata, WB', 'Full-time',
   'Perform quality control testing on formulations and raw materials as per GMP standards.',
   'B.Pharm / M.Pharm with 1-3 years QC experience in a pharma manufacturing facility.'),
  ('area-sales-manager', 'Area Sales Manager', 'Sales', 'Bhubaneswar, OD', 'Full-time',
   'Lead and grow the sales team across Odisha for our pharmaceutical portfolio.',
   '5+ years pharma sales; team-handling experience; own vehicle preferred.');

-- ============ Seed admin user ============
-- Create auth user (idempotent) for Sohel.Islam@ibm.com
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower('Sohel.Islam@ibm.com');
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token,
      recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'Sohel.Islam@ibm.com',
      crypt('Sohel@34892', gen_salt('bf')),
      now(), now(), now(),
      jsonb_build_object('provider','email','providers',ARRAY['email']),
      '{}'::jsonb,
      FALSE, '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_user_id, v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', 'Sohel.Islam@ibm.com', 'email_verified', true),
      'email', now(), now(), now()
    );
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
