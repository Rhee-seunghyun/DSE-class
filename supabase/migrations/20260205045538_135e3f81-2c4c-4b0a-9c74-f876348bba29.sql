-- Staff can update whitelist entries for their assigned lectures
CREATE POLICY "Staff can update whitelist for assigned lectures"
ON public.whitelist
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.staff_lecture_assignments sla
    WHERE sla.lecture_id = whitelist.lecture_id
      AND sla.staff_user_id = auth.uid()
  )
);

-- Staff can delete whitelist entries for their assigned lectures
CREATE POLICY "Staff can delete whitelist for assigned lectures"
ON public.whitelist
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.staff_lecture_assignments sla
    WHERE sla.lecture_id = whitelist.lecture_id
      AND sla.staff_user_id = auth.uid()
  )
);