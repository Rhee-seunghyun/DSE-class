-- Add Speaker-specific policy to only view profiles of enrolled students
CREATE POLICY "Speakers can view enrolled student profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  -- User is viewing their own profile
  auth.uid() = user_id
  OR
  -- User is a speaker viewing profiles of students in their lectures
  (
    has_role(auth.uid(), 'speaker') AND
    EXISTS (
      SELECT 1
      FROM public.whitelist w
      WHERE w.email = profiles.email
        AND w.is_registered = true
        AND EXISTS (
          SELECT 1 FROM public.lectures l
          WHERE l.id = w.lecture_id
            AND l.speaker_id = auth.uid()
        )
    )
  )
);

-- Drop the overly permissive policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate more restrictive user policy (combined with speaker policy above)
-- The speaker policy now handles both self-view and enrolled students