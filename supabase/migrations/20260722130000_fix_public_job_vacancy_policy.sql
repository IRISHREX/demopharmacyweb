-- Keep open vacancies readable by anonymous visitors.
-- The previous SELECT policy called public.has_role(...), but execute on that
-- function is intentionally revoked from anon. Splitting the policies prevents
-- anon reads from evaluating the admin role helper.

DROP POLICY IF EXISTS "Public can view open vacancies" ON public.job_vacancies;

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
