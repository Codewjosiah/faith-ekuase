CREATE POLICY "Admins can upload CMS media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cms-media' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view CMS media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'cms-media' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update CMS media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cms-media' AND private.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'cms-media' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete CMS media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cms-media' AND private.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.claim_initial_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR lower(coalesce(auth.jwt() ->> 'email', '')) <> 'faithekuase1@gmail.com' THEN
    RETURN FALSE;
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN FALSE;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_initial_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_initial_admin() TO authenticated;