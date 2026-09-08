REVOKE ALL ON FUNCTION public.claim_initial_admin() FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.claim_initial_admin();