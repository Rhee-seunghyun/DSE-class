-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Speakers can view enrolled student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all lectures" ON public.lectures;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;

-- Recreate profiles policies without circular references
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

-- Master can view all profiles (using direct role check without function)
CREATE POLICY "Master can view profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'master'
  )
);

-- Staff can view all profiles (using direct role check without function)
CREATE POLICY "Staff can view profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'staff'
  )
);

-- Speakers can view profiles of students enrolled in their lectures
CREATE POLICY "Speakers can view enrolled students" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'speaker'
  ) AND
  EXISTS (
    SELECT 1 FROM public.whitelist w
    INNER JOIN public.lectures l ON l.id = w.lecture_id
    WHERE w.email = profiles.email 
    AND w.is_registered = true
    AND l.speaker_id = auth.uid()
  )
);

-- Fix lectures policy - use direct role check
DROP POLICY IF EXISTS "Staff can view all lectures" ON public.lectures;
CREATE POLICY "Staff can view lectures" 
ON public.lectures FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'staff'
  )
);