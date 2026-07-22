
-- Job application form fields (per vacancy, admin-configurable)
CREATE TABLE public.job_application_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id uuid NOT NULL REFERENCES public.job_vacancies(id) ON DELETE CASCADE,
  label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  options jsonb,
  required boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.job_application_fields TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_application_fields TO authenticated;
GRANT ALL ON public.job_application_fields TO service_role;
ALTER TABLE public.job_application_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read job fields" ON public.job_application_fields FOR SELECT USING (true);
CREATE POLICY "Admins manage job fields" ON public.job_application_fields FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Job applications
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id uuid NOT NULL REFERENCES public.job_vacancies(id) ON DELETE CASCADE,
  applicant_name text NOT NULL,
  applicant_phone text NOT NULL,
  applicant_email text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  resume_url text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.job_applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public submit application" ON public.job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read applications" ON public.job_applications FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update applications" ON public.job_applications FOR UPDATE
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete applications" ON public.job_applications FOR DELETE USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX ON public.job_applications (vacancy_id, created_at DESC);

-- Product inquiries
CREATE TABLE public.product_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  question text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.product_inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_inquiries TO authenticated;
GRANT ALL ON public.product_inquiries TO service_role;
ALTER TABLE public.product_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public submit product inquiry" ON public.product_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read product inquiries" ON public.product_inquiries FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update product inquiries" ON public.product_inquiries FOR UPDATE
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete product inquiries" ON public.product_inquiries FOR DELETE USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX ON public.product_inquiries (product_id, created_at DESC);
