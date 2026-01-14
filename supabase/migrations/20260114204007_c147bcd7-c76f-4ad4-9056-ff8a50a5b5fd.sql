-- Fix critical security: Restrict SELECT on appointments to staff and patients viewing their own
DROP POLICY IF EXISTS "Anyone can read appointments" ON public.appointments;
CREATE POLICY "Staff can read all appointments" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'doctor'))
);
CREATE POLICY "Patients can view own appointments" ON public.appointments FOR SELECT USING (
  patient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Fix push_subscriptions - only allow users to see their own
DROP POLICY IF EXISTS "Anyone can read subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can read own subscriptions" ON public.push_subscriptions FOR SELECT USING (
  patient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Fix referrals - only involved parties can read
DROP POLICY IF EXISTS "Anyone can read referrals" ON public.referrals;
CREATE POLICY "Involved parties can read referrals" ON public.referrals FOR SELECT USING (
  referrer_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  referred_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Fix reviews - hide unpublished reviews from public
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
CREATE POLICY "Public can see published reviews" ON public.reviews FOR SELECT USING (
  is_published = true OR
  patient_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);