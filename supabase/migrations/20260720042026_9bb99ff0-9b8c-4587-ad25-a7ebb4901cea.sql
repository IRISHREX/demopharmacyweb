
-- Public read of media bucket, admin writes
CREATE POLICY "Media: public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'media');
CREATE POLICY "Media: admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Media: admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Media: admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

-- Site settings singleton
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  site_name text NOT NULL DEFAULT 'Zaxia Healthcare',
  tagline text,
  logo_url text,
  address text DEFAULT '127/24, Dhankal, Hatiara, Kolkata – 700157, West Bengal',
  phone text DEFAULT '+91 80171-90377',
  email text DEFAULT 'zaxiahealthcare@gmail.com',
  google_maps_url text,
  latitude numeric,
  longitude numeric,
  theme jsonb NOT NULL DEFAULT '{"mode":"light","primary":"#0b6bcb"}'::jsonb,
  quote_text text DEFAULT 'Trust in science. Care in every dose.',
  quote_author text DEFAULT 'Zaxia Healthcare',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Site settings admin write" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (singleton) VALUES (true);

-- Add media_type to products & blog_posts for videos/gifs/3d
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';
