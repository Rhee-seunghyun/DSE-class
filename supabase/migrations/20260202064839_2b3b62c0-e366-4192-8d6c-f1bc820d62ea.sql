-- Create enum for question types
CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'short_answer', 'long_answer');

-- Create application forms table (form templates linked to lectures)
CREATE TABLE public.application_forms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form questions table
CREATE TABLE public.form_questions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID NOT NULL REFERENCES public.application_forms(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL DEFAULT 'short_answer',
    options JSONB, -- For multiple choice options
    is_required BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form responses table (submissions)
CREATE TABLE public.form_responses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID NOT NULL REFERENCES public.application_forms(id) ON DELETE CASCADE,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    license_number TEXT,
    answers JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for application_forms
CREATE POLICY "Speakers can manage their own forms"
ON public.application_forms
FOR ALL
USING (auth.uid() = speaker_id);

CREATE POLICY "Anyone can view active forms"
ON public.application_forms
FOR SELECT
USING (is_active = true);

-- RLS policies for form_questions
CREATE POLICY "Speakers can manage questions for their forms"
ON public.form_questions
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.application_forms af
    WHERE af.id = form_questions.form_id AND af.speaker_id = auth.uid()
));

CREATE POLICY "Anyone can view questions for active forms"
ON public.form_questions
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.application_forms af
    WHERE af.id = form_questions.form_id AND af.is_active = true
));

-- RLS policies for form_responses
CREATE POLICY "Speakers can view responses for their forms"
ON public.form_responses
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.application_forms af
    WHERE af.id = form_responses.form_id AND af.speaker_id = auth.uid()
));

CREATE POLICY "Speakers can update responses for their forms"
ON public.form_responses
FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.application_forms af
    WHERE af.id = form_responses.form_id AND af.speaker_id = auth.uid()
));

CREATE POLICY "Anyone can submit responses to active forms"
ON public.form_responses
FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.application_forms af
    WHERE af.id = form_responses.form_id AND af.is_active = true
));

-- Add triggers for updated_at
CREATE TRIGGER update_application_forms_updated_at
BEFORE UPDATE ON public.application_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();