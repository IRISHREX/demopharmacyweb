-- Show every blog post on the public blog page, including drafts and future posts.

DROP POLICY IF EXISTS "blog public read published" ON public.blog_posts;

CREATE POLICY "blog public read all"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (true);
