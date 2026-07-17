
-- Utility trigger fn
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  price_inr numeric(10,2),
  image_url text,
  in_stock boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (true);
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_featured_idx ON public.products(featured);

-- BLOG POSTS
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text,
  image_url text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog public read published" ON public.blog_posts
  FOR SELECT USING (published_at IS NOT NULL AND published_at <= now());
CREATE TRIGGER blog_posts_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- INQUIRIES
CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inquiries public insert" ON public.inquiries FOR INSERT WITH CHECK (
  length(name) between 1 and 120
  AND length(email) between 3 and 200
  AND length(message) between 1 and 4000
  AND (phone IS NULL OR length(phone) <= 40)
);

-- SEED CATEGORIES
INSERT INTO public.categories (slug, name, sort_order) VALUES
  ('capsules', 'Capsules', 1),
  ('tablets', 'Tablets', 2),
  ('syrups', 'Syrups', 3),
  ('injections', 'Injections', 4),
  ('other', 'Other', 5);

-- SEED PRODUCTS
WITH c AS (SELECT id, slug FROM public.categories)
INSERT INTO public.products (slug, name, description, category_id, featured) VALUES
  ('esmoxia-ls', 'ESMOXIA-LS', 'Acid reflux management capsule combining esomeprazole with levosulpiride for effective symptom relief.', (SELECT id FROM c WHERE slug='capsules'), true),
  ('zaxstone', 'ZAXSTONE', 'Supportive capsule formulated to aid in the management of urinary stones.', (SELECT id FROM c WHERE slug='capsules'), false),
  ('zaxvit-plus-softgel', 'ZAXVIT-PLUS (Softgel)', 'Multivitamin & multimineral softgel capsule for daily nutritional support.', (SELECT id FROM c WHERE slug='capsules'), true),
  ('zaxpain', 'ZAXPAIN', 'Analgesic capsule for the relief of moderate pain and inflammation.', (SELECT id FROM c WHERE slug='capsules'), false),
  ('pantoxia-dsr', 'PANTOXIA-DSR', 'Pantoprazole + Domperidone SR capsule for GERD and gastric acid disorders.', (SELECT id FROM c WHERE slug='capsules'), true),
  ('esmoxia-dsr', 'ESMOXIA-DSR', 'Esomeprazole + Domperidone SR capsule for acid reflux and dyspepsia.', (SELECT id FROM c WHERE slug='capsules'), false),
  ('calxia-k27-softgel', 'CALXIA-K27 (Softgel)', 'Calcium with Vitamin K27 softgel to support bone density and cardiovascular health.', (SELECT id FROM c WHERE slug='capsules'), false),
  ('calxia-d3-softgel', 'CALXIA-D3 (Softgel)', 'High-strength Vitamin D3 softgel to correct deficiency and support bone health.', (SELECT id FROM c WHERE slug='capsules'), false),

  ('zaxliv-300', 'ZAXLIV-300', 'Hepato-protective tablet supporting liver function and detoxification.', (SELECT id FROM c WHERE slug='tablets'), false),
  ('zace-sp', 'ZACE-SP', 'Aceclofenac + Paracetamol + Serratiopeptidase tablet for pain and inflammation.', (SELECT id FROM c WHERE slug='tablets'), true),
  ('zace-p', 'ZACE-P', 'Aceclofenac + Paracetamol tablet for effective relief from pain and fever.', (SELECT id FROM c WHERE slug='tablets'), false),
  ('mefdot', 'MEFDOT', 'Mefenamic acid tablet indicated for menstrual pain and mild-to-moderate pain.', (SELECT id FROM c WHERE slug='tablets'), false),
  ('levozax-m-tab', 'LEVOZAX-M', 'Levocetirizine + Montelukast tablet for allergic rhinitis and asthma management.', (SELECT id FROM c WHERE slug='tablets'), true),

  ('zaxvit-plus-syrup', 'ZAXVIT-PLUS Syrup', 'Multivitamin syrup for daily wellness across all age groups.', (SELECT id FROM c WHERE slug='syrups'), false),
  ('levozax-m-syrup', 'LEVOZAX-M Syrup', 'Pediatric-friendly Levocetirizine + Montelukast syrup for respiratory allergies.', (SELECT id FROM c WHERE slug='syrups'), true),

  ('pantoxia-iv', 'PANTOXIA-IV', 'Pantoprazole injection for hospital use in acute acid-related disorders.', (SELECT id FROM c WHERE slug='injections'), true),

  ('calxia-d3-nano-shot', 'CALXIA-D3 NANO SHOT', 'Fast-absorbing nano Vitamin D3 shot for rapid correction of deficiency.', (SELECT id FROM c WHERE slug='other'), true);
