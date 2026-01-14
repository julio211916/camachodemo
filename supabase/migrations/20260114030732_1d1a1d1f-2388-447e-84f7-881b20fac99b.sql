-- Drop existing INSERT policy for profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create new INSERT policy allowing admin/staff/doctor to create patient profiles
CREATE POLICY "Staff can insert profiles for patients" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'staff'::app_role) 
  OR has_role(auth.uid(), 'doctor'::app_role)
);

-- Add a policy for admin/staff/doctor to update any profile (for patient management)
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
CREATE POLICY "Staff can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'staff'::app_role) 
  OR has_role(auth.uid(), 'doctor'::app_role)
);