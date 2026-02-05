-- Staff can view form responses for their assigned lectures
CREATE POLICY "Staff can view form responses for assigned lectures"
ON public.form_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.application_forms af
    JOIN public.staff_lecture_assignments sla ON sla.lecture_id = af.lecture_id
    WHERE af.id = form_responses.form_id
      AND sla.staff_user_id = auth.uid()
  )
);

-- Staff can update form responses for their assigned lectures
CREATE POLICY "Staff can update form responses for assigned lectures"
ON public.form_responses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.application_forms af
    JOIN public.staff_lecture_assignments sla ON sla.lecture_id = af.lecture_id
    WHERE af.id = form_responses.form_id
      AND sla.staff_user_id = auth.uid()
  )
);