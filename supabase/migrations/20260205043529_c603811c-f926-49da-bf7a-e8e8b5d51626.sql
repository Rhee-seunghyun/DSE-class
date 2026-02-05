-- Staff와 Class(Lecture) 할당 관계를 저장하는 테이블 생성
CREATE TABLE public.staff_lecture_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id uuid NOT NULL,
    lecture_id uuid NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    assigned_by uuid NOT NULL,
    assigned_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (staff_user_id, lecture_id)
);

-- RLS 활성화
ALTER TABLE public.staff_lecture_assignments ENABLE ROW LEVEL SECURITY;

-- Master는 모든 할당을 관리할 수 있음
CREATE POLICY "Master can manage all staff assignments"
ON public.staff_lecture_assignments
FOR ALL
USING (has_role(auth.uid(), 'master'));

-- Staff는 자신의 할당 정보를 볼 수 있음
CREATE POLICY "Staff can view their own assignments"
ON public.staff_lecture_assignments
FOR SELECT
USING (auth.uid() = staff_user_id);

-- Speaker는 자신의 강의에 대한 할당 정보를 볼 수 있음
CREATE POLICY "Speakers can view assignments for their lectures"
ON public.staff_lecture_assignments
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.lectures l
    WHERE l.id = staff_lecture_assignments.lecture_id
    AND l.speaker_id = auth.uid()
));