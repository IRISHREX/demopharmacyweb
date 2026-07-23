-- Anonymous visitors still hit "permission denied for function has_role" when
-- reading job_vacancies. The earlier fix (20260722130000) added an anon SELECT
-- policy USING (is_open = TRUE), but left the "Admins manage vacancies" FOR ALL
-- policy applicable to every role (no TO clause). For anon SELECTs the two
-- permissive policies are OR'd into (is_open = TRUE) OR public.has_role(...),
-- and has_role gets evaluated on non-open rows -> 42501 (anon lacks EXECUTE,
-- which was intentionally revoked in 20260718021538).
--
-- Fix: scope the admin management policies to authenticated only. Admins are
-- always authenticated, so anon SELECTs no longer reference has_role at all.

-- Ensure the role-split SELECT policies exist (idempotent).
DROP POLICY IF EXISTS "Public can view open vacancies" ON public.job_vacancies;
DROP POLICY IF EXISTS "Anon can view open vacancies" ON public.job_vacancies;
DROP POLICY IF EXISTS "Authenticated can view open vacancies" ON public.job_vacancies;
DROP POLICY IF EXISTS "Admins can view all vacancies" ON public.job_vacancies;

CREATE POLICY "Anon can view open vacancies"
  ON public.job_vacancies FOR SELECT
  TO anon
  USING (is_open = TRUE);

CREATE POLICY "Authenticated can view open vacancies"
  ON public.job_vacancies FOR SELECT
  TO authenticated
  USING (is_open = TRUE);

CREATE POLICY "Admins can view all vacancies"
  ON public.job_vacancies FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Restrict the management policy to authenticated so anon never evaluates has_role.
DROP POLICY IF EXISTS "Admins manage vacancies" ON public.job_vacancies;
CREATE POLICY "Admins manage vacancies"
  ON public.job_vacancies FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- job_application_fields is read by anon on the apply page. Its public read policy
-- is USING (true) (constant-folded, so it currently works), but scope the admin
-- FOR ALL policy to authenticated too for consistency and future-proofing.
DROP POLICY IF EXISTS "Admins manage job fields" ON public.job_application_fields;
CREATE POLICY "Admins manage job fields"
  ON public.job_application_fields FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
