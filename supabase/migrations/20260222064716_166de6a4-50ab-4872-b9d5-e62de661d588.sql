
-- Allow admins to view all flags
CREATE POLICY "Admins can view all flags"
ON public.flags
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update flags (resolve)
CREATE POLICY "Admins can update flags"
ON public.flags
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any question (remove/moderate)
CREATE POLICY "Admins can update any question"
ON public.questions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all earnings
CREATE POLICY "Admins can view all earnings"
ON public.earnings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
