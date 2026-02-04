-- Create lecture_materials table for managing multiple materials per lecture
CREATE TABLE public.lecture_materials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lecture_materials ENABLE ROW LEVEL SECURITY;

-- Speakers/Masters can manage their own lecture materials
CREATE POLICY "Speakers can manage their own lecture materials"
ON public.lecture_materials
FOR ALL
USING (auth.uid() = speaker_id);

-- Students can view published materials for lectures they have access to
CREATE POLICY "Students can view published lecture materials"
ON public.lecture_materials
FOR SELECT
USING (
    is_published = true
    AND EXISTS (
        SELECT 1
        FROM whitelist w
        JOIN profiles p ON p.email = w.email
        WHERE w.lecture_id = lecture_materials.lecture_id
          AND p.user_id = auth.uid()
          AND w.is_registered = true
    )
);

-- Master can view all materials
CREATE POLICY "Master can view all lecture materials"
ON public.lecture_materials
FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_lecture_materials_updated_at
    BEFORE UPDATE ON public.lecture_materials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for lecture materials if not exists (using existing lecture-files bucket)
-- Update storage policy to allow proper access