
CREATE TABLE public.student_drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  lecture_id uuid NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.lecture_materials(id) ON DELETE CASCADE,
  page_number integer NOT NULL DEFAULT 1,
  drawing_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (student_id, material_id, page_number)
);

ALTER TABLE public.student_drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own drawings"
  ON public.student_drawings FOR ALL
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE TRIGGER update_student_drawings_updated_at
  BEFORE UPDATE ON public.student_drawings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
