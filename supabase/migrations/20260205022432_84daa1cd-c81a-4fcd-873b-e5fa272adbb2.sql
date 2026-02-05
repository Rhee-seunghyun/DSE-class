-- Create a helper function to check if user is master or staff
CREATE OR REPLACE FUNCTION public.is_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('master', 'staff')
  )
$$;

-- Update RLS policies to include staff role

-- lectures: staff can view all lectures (like master)
CREATE POLICY "Staff can view all lectures"
ON public.lectures
FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- lecture_materials: staff can view all (like master)
CREATE POLICY "Staff can view all lecture materials"
ON public.lecture_materials
FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- profiles: staff can view all profiles (like master)
CREATE POLICY "Staff can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- security_logs: staff can view all (like master)
CREATE POLICY "Staff can view all security logs"
ON public.security_logs
FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- whitelist: staff can view all (like master)
CREATE POLICY "Staff can view all whitelist entries"
ON public.whitelist
FOR SELECT
USING (has_role(auth.uid(), 'staff'));