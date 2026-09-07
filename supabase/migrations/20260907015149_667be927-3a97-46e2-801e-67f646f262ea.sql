CREATE SCHEMA IF NOT EXISTS private;
CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role TEXT)
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
REVOKE ALL ON FUNCTION private.has_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(UUID, TEXT) TO authenticated;

DROP POLICY IF EXISTS "Admins can manage site content" ON public.site_content;
CREATE POLICY "Admins can manage site content" ON public.site_content FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage media assets" ON public.media_assets;
CREATE POLICY "Admins can manage media assets" ON public.media_assets FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage vlogs" ON public.vlogs;
CREATE POLICY "Admins can manage vlogs" ON public.vlogs FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage social links" ON public.social_links;
CREATE POLICY "Admins can manage social links" ON public.social_links FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage section settings" ON public.section_settings;
CREATE POLICY "Admins can manage section settings" ON public.section_settings FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

REVOKE ALL ON FUNCTION public.has_role(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_first_admin(UUID) FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT);
DROP FUNCTION IF EXISTS public.claim_first_admin(UUID);

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());