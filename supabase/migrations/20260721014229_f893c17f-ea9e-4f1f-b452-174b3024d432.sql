
-- Blog engagement + page views
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.blog_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, visitor_id)
);
GRANT SELECT, INSERT, DELETE ON public.blog_post_likes TO anon, authenticated;
GRANT ALL ON public.blog_post_likes TO service_role;
ALTER TABLE public.blog_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read likes" ON public.blog_post_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can add a like" ON public.blog_post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can remove own like" ON public.blog_post_likes FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.blog_post_likes_bump() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_blog_post_likes_bump ON public.blog_post_likes;
CREATE TRIGGER trg_blog_post_likes_bump
AFTER INSERT OR DELETE ON public.blog_post_likes
FOR EACH ROW EXECUTE FUNCTION public.blog_post_likes_bump();

CREATE OR REPLACE FUNCTION public.increment_blog_view(_post_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.blog_posts SET views_count = views_count + 1 WHERE id = _post_id;
$$;
GRANT EXECUTE ON FUNCTION public.increment_blog_view(uuid) TO anon, authenticated;

-- Site visits
CREATE TABLE IF NOT EXISTS public.page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  visitor_id text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.page_visits TO anon, authenticated;
GRANT SELECT ON public.page_visits TO authenticated;
GRANT ALL ON public.page_visits TO service_role;
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can record a visit" ON public.page_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read visits" ON public.page_visits FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON public.page_visits(created_at DESC);
