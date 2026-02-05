-- Fix infinite recursion by removing circular RLS references between profiles <-> whitelist
-- Root cause:
--  - profiles SELECT policy references whitelist
--  - whitelist SELECT policy references profiles
-- This creates infinite recursion (42P17).

-- 1) whitelist: replace "Users can view their own whitelist entries" to avoid reading profiles
DROP POLICY IF EXISTS "Users can view their own whitelist entries" ON public.whitelist;
CREATE POLICY "Users can view their own whitelist entries"
ON public.whitelist
FOR SELECT
USING (
  -- Use email from auth JWT claims to match whitelist rows
  lower(whitelist.email) = lower((auth.jwt() ->> 'email'))
);

-- 2) lectures: replace student access policy to avoid joining profiles
DROP POLICY IF EXISTS "Students can view lectures they have access to" ON public.lectures;
CREATE POLICY "Students can view lectures they have access to"
ON public.lectures
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.whitelist w
    WHERE w.lecture_id = lectures.id
      AND w.is_registered = true
      AND lower(w.email) = lower((auth.jwt() ->> 'email'))
  )
);

-- 3) lecture_materials: replace student access policy to avoid joining profiles
DROP POLICY IF EXISTS "Students can view published lecture materials" ON public.lecture_materials;
CREATE POLICY "Students can view published lecture materials"
ON public.lecture_materials
FOR SELECT
USING (
  lecture_materials.is_published = true
  AND EXISTS (
    SELECT 1
    FROM public.whitelist w
    WHERE w.lecture_id = lecture_materials.lecture_id
      AND w.is_registered = true
      AND lower(w.email) = lower((auth.jwt() ->> 'email'))
  )
);
