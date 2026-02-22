
-- Fix overly permissive INSERT policy - restrict to service role only
DROP POLICY "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
