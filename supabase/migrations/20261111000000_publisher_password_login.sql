-- ==============================================================================
-- Homeo India — Publishing panel needs an email + password sign-in
-- Migration: 20261111000000_publisher_password_login.sql
--
-- A publisher can only post while signed in with their EMAIL AND PASSWORD.
-- Signing in to the same account another way (e.g. "Continue with Google")
-- gives normal member access only; the Publishing panel then asks them to
-- sign in with their password.
--
-- The sign-in method comes from the `amr` claim in the Supabase login token,
-- which the browser cannot change.
-- Idempotent.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.signed_in_with_password()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() -> 'amr') @> '[{"method": "password"}]'::jsonb, false);
$$;
REVOKE ALL ON FUNCTION public.signed_in_with_password() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.signed_in_with_password() TO authenticated, service_role;

-- Publishing rights: publisher role AND a password sign-in.
CREATE OR REPLACE FUNCTION public.is_publisher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.signed_in_with_password()
     AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'publisher');
$$;
REVOKE ALL ON FUNCTION public.is_publisher() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_publisher() TO authenticated, service_role;

-- For the website: 'ok', 'password_required' (publisher, but signed in another
-- way) or 'none'.
CREATE OR REPLACE FUNCTION public.publisher_access()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'publisher') THEN 'none'
    WHEN public.signed_in_with_password() THEN 'ok'
    ELSE 'password_required'
  END;
$$;
REVOKE ALL ON FUNCTION public.publisher_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publisher_access() TO authenticated, service_role;
