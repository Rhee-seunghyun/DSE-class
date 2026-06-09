
-- 1. Storage lecture-files: scope by enrollment
DROP POLICY IF EXISTS "Authenticated users can view lecture files" ON storage.objects;

CREATE POLICY "Users can view enrolled or owned lecture files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lecture-files'
  AND (
    -- speaker/master can access all lecture files
    has_role(auth.uid(), 'master'::app_role)
    OR has_role(auth.uid(), 'speaker'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
    -- students: must be registered in whitelist for the lecture (path: speaker_id/lecture_id/...)
    OR EXISTS (
      SELECT 1 FROM public.whitelist w
      WHERE w.lecture_id::text = (storage.foldername(name))[2]
        AND lower(w.email) = lower(auth.jwt() ->> 'email')
        AND w.is_registered = true
    )
  )
);

-- 2. Whitelist: scope staff SELECT to assigned lectures
DROP POLICY IF EXISTS "Staff can view all whitelist entries" ON public.whitelist;

CREATE POLICY "Staff can view whitelist for assigned lectures"
ON public.whitelist FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.staff_lecture_assignments sla
    WHERE sla.lecture_id = whitelist.lecture_id
      AND sla.staff_user_id = auth.uid()
  )
);

-- 3. Profiles: scope staff SELECT to assigned-lecture students
DROP POLICY IF EXISTS "Staff can view profiles" ON public.profiles;

CREATE POLICY "Staff can view assigned lecture profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.whitelist w
    JOIN public.staff_lecture_assignments sla ON sla.lecture_id = w.lecture_id
    WHERE lower(w.email) = lower(profiles.email)
      AND w.is_registered = true
      AND sla.staff_user_id = auth.uid()
  )
);

-- 4. Security logs INSERT: enforce user_id = auth.uid()
DROP POLICY IF EXISTS "Authenticated users can insert security logs" ON public.security_logs;

CREATE POLICY "Users can insert their own security logs"
ON public.security_logs FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (user_email IS NULL OR lower(user_email) = lower(auth.jwt() ->> 'email'))
);

-- 5. Security logs SELECT: scope staff to assigned lectures
DROP POLICY IF EXISTS "Staff can view all security logs" ON public.security_logs;

CREATE POLICY "Staff can view security logs for assigned lectures"
ON public.security_logs FOR SELECT
TO authenticated
USING (
  lecture_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.staff_lecture_assignments sla
    WHERE sla.lecture_id = security_logs.lecture_id
      AND sla.staff_user_id = auth.uid()
  )
);

-- 6. lecture_notes: remove speaker access to student notes
DROP POLICY IF EXISTS "Speakers can view notes for their lectures" ON public.lecture_notes;

-- 7. Master email check moved server-side
CREATE OR REPLACE FUNCTION public.is_master_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(_email) = 'omsrheesh@gmail.com';
$$;

REVOKE EXECUTE ON FUNCTION public.is_master_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_master_email(text) TO anon, authenticated;

-- 8. Lock down has_role / get_user_role / is_admin_role to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_role(uuid) TO authenticated;
