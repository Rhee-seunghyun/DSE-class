-- Create lecture_questions table for Q&A functionality
CREATE TABLE public.lecture_questions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    student_name TEXT NOT NULL,
    question_text TEXT NOT NULL,
    is_answered BOOLEAN NOT NULL DEFAULT false,
    answered_by UUID,
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lecture_questions ENABLE ROW LEVEL SECURITY;

-- Students can insert questions for lectures they have access to
CREATE POLICY "Students can submit questions"
ON public.lecture_questions
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
        SELECT 1 FROM public.whitelist w
        WHERE w.lecture_id = lecture_questions.lecture_id
        AND w.is_registered = true
        AND lower(w.email) = lower((auth.jwt() ->> 'email'::text))
    )
);

-- Students can view their own questions
CREATE POLICY "Students can view own questions"
ON public.lecture_questions
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Speakers can view and update questions for their lectures
CREATE POLICY "Speakers can view questions for their lectures"
ON public.lecture_questions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.lectures l
        WHERE l.id = lecture_questions.lecture_id
        AND l.speaker_id = auth.uid()
    )
);

CREATE POLICY "Speakers can update questions for their lectures"
ON public.lecture_questions
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.lectures l
        WHERE l.id = lecture_questions.lecture_id
        AND l.speaker_id = auth.uid()
    )
);

-- Master can view all questions
CREATE POLICY "Master can view all questions"
ON public.lecture_questions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Master can update all questions"
ON public.lecture_questions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role));

-- Staff can view questions for assigned lectures
CREATE POLICY "Staff can view questions for assigned lectures"
ON public.lecture_questions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_lecture_assignments sla
        WHERE sla.lecture_id = lecture_questions.lecture_id
        AND sla.staff_user_id = auth.uid()
    )
);

CREATE POLICY "Staff can update questions for assigned lectures"
ON public.lecture_questions
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_lecture_assignments sla
        WHERE sla.lecture_id = lecture_questions.lecture_id
        AND sla.staff_user_id = auth.uid()
    )
);