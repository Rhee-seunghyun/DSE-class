
-- Fix infinite recursion in RLS policies by extracting cross-table lookups into SECURITY DEFINER functions

-- 1. Helper functions
CREATE OR REPLACE FUNCTION public.student_has_lecture_access(_lecture_id uuid, _email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.whitelist w
    WHERE w.lecture_id = _lecture_id
      AND w.is_registered = true
      AND lower(w.email) = lower(_email)
  );
$$;

CREATE OR REPLACE FUNCTION public.speaker_owns_lecture(_user_id uuid, _lecture_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lectures l
    WHERE l.id = _lecture_id AND l.speaker_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.staff_assigned_to_lecture(_user_id uuid, _lecture_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_lecture_assignments sla
    WHERE sla.lecture_id = _lecture_id AND sla.staff_user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.speaker_has_enrolled_student(_user_id uuid, _student_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.whitelist w
    JOIN public.lectures l ON l.id = w.lecture_id
    WHERE lower(w.email) = lower(_student_email)
      AND w.is_registered = true
      AND l.speaker_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.staff_assigned_to_student(_user_id uuid, _student_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.whitelist w
    JOIN public.staff_lecture_assignments sla ON sla.lecture_id = w.lecture_id
    WHERE lower(w.email) = lower(_student_email)
      AND w.is_registered = true
      AND sla.staff_user_id = _user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.student_has_lecture_access(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.speaker_owns_lecture(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_assigned_to_lecture(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.speaker_has_enrolled_student(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_assigned_to_student(uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.student_has_lecture_access(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.speaker_owns_lecture(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_assigned_to_lecture(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.speaker_has_enrolled_student(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_assigned_to_student(uuid, text) TO authenticated;

-- 2. lectures: replace student policy
DROP POLICY IF EXISTS "Students can view lectures they have access to" ON public.lectures;
CREATE POLICY "Students can view lectures they have access to"
ON public.lectures FOR SELECT
TO authenticated
USING (public.student_has_lecture_access(id, auth.jwt() ->> 'email'));

-- 3. staff_lecture_assignments: replace speaker policy
DROP POLICY IF EXISTS "Speakers can view assignments for their lectures" ON public.staff_lecture_assignments;
CREATE POLICY "Speakers can view assignments for their lectures"
ON public.staff_lecture_assignments FOR SELECT
TO authenticated
USING (public.speaker_owns_lecture(auth.uid(), lecture_id));

-- 4. whitelist: replace staff policies (SELECT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Staff can view whitelist for assigned lectures" ON public.whitelist;
DROP POLICY IF EXISTS "Staff can update whitelist for assigned lectures" ON public.whitelist;
DROP POLICY IF EXISTS "Staff can delete whitelist for assigned lectures" ON public.whitelist;

CREATE POLICY "Staff can view whitelist for assigned lectures"
ON public.whitelist FOR SELECT
TO authenticated
USING (public.staff_assigned_to_lecture(auth.uid(), lecture_id));

CREATE POLICY "Staff can update whitelist for assigned lectures"
ON public.whitelist FOR UPDATE
TO authenticated
USING (public.staff_assigned_to_lecture(auth.uid(), lecture_id));

CREATE POLICY "Staff can delete whitelist for assigned lectures"
ON public.whitelist FOR DELETE
TO authenticated
USING (public.staff_assigned_to_lecture(auth.uid(), lecture_id));

-- 5. profiles: replace cross-table policies
DROP POLICY IF EXISTS "Speakers can view enrolled students" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view assigned lecture profiles" ON public.profiles;

CREATE POLICY "Speakers can view enrolled students"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'speaker'::app_role)
  AND public.speaker_has_enrolled_student(auth.uid(), email)
);

CREATE POLICY "Staff can view assigned lecture profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.staff_assigned_to_student(auth.uid(), email));
