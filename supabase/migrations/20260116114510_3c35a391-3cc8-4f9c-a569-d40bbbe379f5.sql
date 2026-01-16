-- Staff/Doctors/Admins need to see only real patients (exclude users with privileged roles)

CREATE OR REPLACE FUNCTION public.get_patient_profiles(
  p_search TEXT DEFAULT NULL,
  p_show_archived BOOLEAN DEFAULT false,
  p_limit INT DEFAULT 200
)
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'staff'::public.app_role)
      OR public.has_role(auth.uid(), 'doctor'::public.app_role)
    )
    AND p.is_archived = p_show_archived
    AND (
      p_search IS NULL
      OR p.full_name ILIKE ('%' || p_search || '%')
      OR p.email ILIKE ('%' || p_search || '%')
      OR COALESCE(p.phone, '') ILIKE ('%' || p_search || '%')
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = p.user_id
        AND ur.role IN ('admin'::public.app_role, 'staff'::public.app_role, 'doctor'::public.app_role)
    )
  ORDER BY p.full_name
  LIMIT LEAST(GREATEST(p_limit, 1), 1000);
$$;

CREATE OR REPLACE FUNCTION public.get_patient_profile(
  p_user_id UUID
)
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'staff'::public.app_role)
      OR public.has_role(auth.uid(), 'doctor'::public.app_role)
    )
    AND p.user_id = p_user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = p.user_id
        AND ur.role IN ('admin'::public.app_role, 'staff'::public.app_role, 'doctor'::public.app_role)
    )
  LIMIT 1;
$$;