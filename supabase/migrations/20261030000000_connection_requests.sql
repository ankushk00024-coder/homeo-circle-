-- ==============================================================================
-- Homeo Circle India — Connection requests with a personal note
-- Migration: 20261030000000_connection_requests.sql
--
--  1. A connection request can carry a short note (max 300 characters), shown
--     to the recipient on their dashboard and in My Network.
--  2. SECURITY: the UPDATE policy let the sender change the status too, so a
--     member could accept their own request. Only the recipient (or an admin)
--     can now accept or decline, and only while the request is pending.
--     Sender, recipient, note and creation time can no longer be edited.
--  3. A request cannot be sent when the other member already sent one to you
--     (accept theirs instead), so a pair never ends up with two requests.
--  4. The recipient's notification includes the note.
-- Idempotent: safe to run more than once.
-- ==============================================================================

ALTER TABLE public.connection_requests DROP CONSTRAINT IF EXISTS connection_requests_message_length;
ALTER TABLE public.connection_requests
  ADD CONSTRAINT connection_requests_message_length
  CHECK (message IS NULL OR char_length(message) <= 300);

CREATE OR REPLACE FUNCTION public.guard_connection_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.message := NULLIF(trim(NEW.message), '');
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      NEW.status := 'pending';
      NEW.created_at := now();
      NEW.updated_at := now();
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.connection_requests
      WHERE sender_id = NEW.recipient_id AND recipient_id = NEW.sender_id
        AND status IN ('pending', 'accepted')
    ) THEN
      RAISE EXCEPTION 'This member has already sent you a connection request. Accept it from My Network.'
        USING ERRCODE = '23505';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE. Server-side callers and admins are trusted.
  IF auth.uid() IS NULL OR public.is_admin() THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'A connection request cannot be edited.' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF auth.uid() <> OLD.recipient_id THEN
      RAISE EXCEPTION 'Only the person who received the request can accept or decline it.'
        USING ERRCODE = '42501';
    END IF;
    IF OLD.status <> 'pending' OR NEW.status NOT IN ('accepted', 'declined') THEN
      RAISE EXCEPTION 'This request has already been answered.' USING ERRCODE = '42501';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_connection_request() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_connection_request ON public.connection_requests;
CREATE TRIGGER trg_guard_connection_request
  BEFORE INSERT OR UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_connection_request();

-- Only the recipient (or an admin) may update; the trigger above limits what changes.
DROP POLICY IF EXISTS "Recipients or admins can update connection request status" ON public.connection_requests;
CREATE POLICY "Recipients or admins can update connection request status"
  ON public.connection_requests FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid() OR public.is_admin())
  WITH CHECK (recipient_id = auth.uid() OR public.is_admin());

-- Notification text now carries the note.
CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_name text;
  v_note text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(display_name, full_name, 'A member') INTO v_name FROM public.profiles WHERE id = NEW.sender_id;
    v_note := CASE
      WHEN NEW.message IS NULL THEN ''
      WHEN char_length(NEW.message) > 120 THEN ': "' || left(NEW.message, 117) || '..."'
      ELSE ': "' || NEW.message || '"'
    END;
    INSERT INTO public.app_notifications (
      user_id, sender_id, type, title, message, link, action_url, action_id, action_status, metadata
    ) VALUES (
      NEW.recipient_id,
      NEW.sender_id,
      'connection_request',
      'New Connection Request',
      COALESCE(v_name, 'A member') || ' wants to connect with you' || v_note,
      '/members?tab=network',
      '/members?tab=network',
      NEW.id::text,
      'pending',
      jsonb_build_object('sender_id', NEW.sender_id, 'request_id', NEW.id, 'note', NEW.message)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT COALESCE(display_name, full_name, 'A member') INTO v_name FROM public.profiles WHERE id = NEW.recipient_id;
    INSERT INTO public.app_notifications (
      user_id, sender_id, type, title, message, link, action_url, action_id, action_status, metadata
    ) VALUES (
      NEW.sender_id,
      NEW.recipient_id,
      'connection_accepted',
      'Connection Request Accepted',
      COALESCE(v_name, 'A member') || ' accepted your connection request.',
      '/members?tab=network',
      '/members?tab=network',
      NEW.id::text,
      'accepted',
      jsonb_build_object('recipient_id', NEW.recipient_id, 'request_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_on_connection_request() FROM PUBLIC, anon, authenticated;
