CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.claim_first_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles) THEN
    RETURN FALSE;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin');
  RETURN TRUE;
END;
$$;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_admin(UUID) TO authenticated;

CREATE TABLE public.site_content (
  content_key TEXT NOT NULL PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view site content" ON public.site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage site content" ON public.site_content FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.media_assets (
  asset_key TEXT NOT NULL PRIMARY KEY,
  url TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view media assets" ON public.media_assets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage media assets" ON public.media_assets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.vlogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Vlog',
  description TEXT NOT NULL DEFAULT '',
  media_url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vlogs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vlogs TO authenticated;
GRANT ALL ON public.vlogs TO service_role;
ALTER TABLE public.vlogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view visible vlogs" ON public.vlogs FOR SELECT TO anon, authenticated USING (is_visible = true);
CREATE POLICY "Admins can manage vlogs" ON public.vlogs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'link',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.social_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.social_links TO authenticated;
GRANT ALL ON public.social_links TO service_role;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view visible social links" ON public.social_links FOR SELECT TO anon, authenticated USING (is_visible = true);
CREATE POLICY "Admins can manage social links" ON public.social_links FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.section_settings (
  section_key TEXT NOT NULL PRIMARY KEY,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.section_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.section_settings TO authenticated;
GRANT ALL ON public.section_settings TO service_role;
ALTER TABLE public.section_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view visible sections" ON public.section_settings FOR SELECT TO anon, authenticated USING (is_visible = true);
CREATE POLICY "Admins can manage section settings" ON public.section_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER media_assets_updated_at BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER vlogs_updated_at BEFORE UPDATE ON public.vlogs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER social_links_updated_at BEFORE UPDATE ON public.social_links FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER section_settings_updated_at BEFORE UPDATE ON public.section_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_content (content_key, content) VALUES
('profile', '{"name":"Faith Ekuase","heroKicker":"YouTube Vlogger · Storyteller · Creator","heroTitle":"Life, through my lens.","heroIntro":"I’m Faith Ekuase, a vlogger who loves capturing everyday moments, personal experiences, and the little things that make life worth remembering.","heroSecondLine":"Come along as I share my world, explore new experiences, and create videos that feel real, personal, and worth watching.","heroNote":"Creating moments worth watching.","location":"Based in Benin City","aboutCaption":"hello, it’s Faith ♡","aboutLead":"I’m Faith Ekuase.","aboutIntro":"A Physiotherapy student, a vlogger, and someone who enjoys finding stories in the everyday.","aboutBody":"I love capturing experiences, sharing my perspective, and bringing people along for the moments that make life interesting. My faith is part of that journey too—quietly shaping the way I see things, the values I carry, and the gratitude I have for where I am.","aboutClosing":"Between school, creating, and everything in between, I’m learning, growing, and discovering what I want to say through my videos."}'::jsonb),
('collaboration', '{"eyebrow":"For brands & creative teams","title":"Let’s create something worth watching.","paragraphs":["I love discovering new experiences and sharing them through my vlogs.","For brands, that can mean introducing a product, exploring a place, sharing an experience, or creating a story that feels natural within my content.","I’m open to collaborations that fit my creative style and give my audience something meaningful, useful, or enjoyable to watch."],"ideas":["Sponsored vlogs","Product integrations","Lifestyle features","Experience-based content","Brand storytelling","Creative collaborations"]}'::jsonb),
('contact', '{"eyebrow":"Start a conversation","title":"Have a collaboration in mind?","lead":"I’d love to hear from you. Whether you’re a brand, agency, or creative team, send me your campaign idea, timeline, and what you’d like to create.","email":"faithekuase1@gmail.com","whatsapp":"+234 705 508 2561","whatsappUrl":"https://wa.me/2347055082561","note":"For collaboration enquiries, please include a brief description of your project and the best way to reach you."}'::jsonb),
('media_kit', '{"eyebrow":"The details","title":"Let’s talk numbers.","paragraphs":["Want to know more about my audience, platforms, and collaboration opportunities?","Request my media kit for the latest available creator information."],"requestEmail":"faithekuase1@gmail.com"}'::jsonb),
('settings', '{"footerTagline":"YouTube vlogger · Storyteller · Creator","footerLine":"Life, through my lens.","copyrightYear":"2026","finalEyebrow":"One more thing","finalTitle":"Your next story could start here.","finalLead":"Have a product, experience, or idea you’d love to share through a vlog? Let’s create something people will want to watch."}'::jsonb)
ON CONFLICT (content_key) DO NOTHING;

INSERT INTO public.media_assets (asset_key, url, alt_text) VALUES
('hero', '/__l5e/assets-v1/9806102d-f414-43df-8d78-98bf7331334f/faith-hero.jpg', 'Faith Ekuase with copper braids, looking thoughtfully to the side'),
('about', '/__l5e/assets-v1/451427c8-dfcd-48c6-8536-61bf48af0afe/faith-about.jpg', 'Faith Ekuase introducing herself in a colourful scrapbook-style portrait')
ON CONFLICT (asset_key) DO NOTHING;

INSERT INTO public.vlogs (title, category, description, media_url, sort_order, is_featured) VALUES
('Hair Vlog', 'Beauty diary', 'A personal hair-day vlog, from the process to the finished braids.', '/__l5e/assets-v1/28c6af26-aee2-429a-8bd8-35d8b6aaa707/hair-vlog.mp4', 1, true),
('Productive Morning Routine', 'Daily life', 'A quiet look at the rhythms and little details of a productive morning.', '/__l5e/assets-v1/92c91961-42e9-4326-bd78-f3bdc37442a9/morning-routine.mp4', 2, false),
('A Day in My Life', 'Experience', 'An outdoor summer gathering captured through Faith’s personal perspective.', '/__l5e/assets-v1/2923698f-9808-4fde-aead-d431e7f7a087/day-in-my-life.mp4', 3, false),
('Video 4', 'New vlog', 'A new story is coming soon.', '', 4, false)
ON CONFLICT DO NOTHING;

INSERT INTO public.social_links (label, url, description, icon, sort_order) VALUES
('YouTube', 'https://youtube.com/@faith-ekuase', 'Watch my vlogs and explore my latest videos.', 'youtube', 1),
('Instagram', 'https://www.instagram.com/faith_ekuase/', 'A closer look at my life, creative updates, and moments outside the vlog.', 'instagram', 2),
('Pinterest', 'https://www.pinterest.com/faithekuase1/', 'A collection of visual inspiration, ideas, and things I love.', 'pinterest', 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.section_settings (section_key, sort_order) VALUES
('home', 1), ('vlogs', 2), ('about', 3), ('approach', 4), ('collaborate', 5), ('why', 6), ('media_kit', 7), ('socials', 8), ('contact', 9)
ON CONFLICT (section_key) DO NOTHING;