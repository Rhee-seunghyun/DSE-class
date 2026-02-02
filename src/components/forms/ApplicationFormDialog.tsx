import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormBuilder, FormQuestion } from './FormBuilder';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy } from 'lucide-react';

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lectureId: string;
  speakerId: string;
  lectureTitle: string;
  existingFormId?: string | null;
}

const defaultQuestions: FormQuestion[] = [
  {
    id: crypto.randomUUID(),
    question_text: '이름',
    question_type: 'short_answer',
    is_required: true,
    order_index: 0,
  },
  {
    id: crypto.randomUUID(),
    question_text: '이메일',
    question_type: 'short_answer',
    is_required: true,
    order_index: 1,
  },
  {
    id: crypto.randomUUID(),
    question_text: '면허번호',
    question_type: 'short_answer',
    is_required: false,
    order_index: 2,
  },
];

export function ApplicationFormDialog({
  open,
  onOpenChange,
  lectureId,
  speakerId,
  lectureTitle,
  existingFormId,
}: ApplicationFormDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(`${lectureTitle} 세미나 신청서`);
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<FormQuestion[]>(defaultQuestions);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Fetch existing form for editing
  const { data: existingForm } = useQuery({
    queryKey: ['application-form-detail', existingFormId],
    queryFn: async () => {
      if (!existingFormId) return null;
      const { data: form, error: formError } = await supabase
        .from('application_forms')
        .select('*')
        .eq('id', existingFormId)
        .single();

      if (formError) throw formError;

      const { data: formQuestions, error: questionsError } = await supabase
        .from('form_questions')
        .select('*')
        .eq('form_id', existingFormId)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      return { form, questions: formQuestions };
    },
    enabled: !!existingFormId && open,
  });

  // Fetch all forms by this speaker for template selection
  const { data: allForms } = useQuery({
    queryKey: ['all-speaker-forms', speakerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('application_forms')
        .select('*, lectures!inner(title)')
        .eq('speaker_id', speakerId)
        .neq('lecture_id', lectureId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Load existing form data when editing
  useEffect(() => {
    if (existingForm) {
      setIsEditMode(true);
      setTitle(existingForm.form.title);
      setDescription(existingForm.form.description || '');
      setQuestions(
        existingForm.questions.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          has_other: q.has_other || false,
          is_required: q.is_required,
          order_index: q.order_index,
        }))
      );
    }
  }, [existingForm]);

  // Load template when selected
  const loadTemplate = async (formId: string) => {
    if (!formId) return;

    const { data: formQuestions, error } = await supabase
      .from('form_questions')
      .select('*')
      .eq('form_id', formId)
      .order('order_index', { ascending: true });

    if (error) {
      toast.error('템플릿 불러오기 실패');
      return;
    }

    const templateForm = allForms?.find((f) => f.id === formId);
    if (templateForm) {
      setTitle(`${lectureTitle} 세미나 신청서`);
      setDescription(templateForm.description || '');
      setQuestions(
        formQuestions.map((q: any, index: number) => ({
          id: crypto.randomUUID(),
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          has_other: q.has_other || false,
          is_required: q.is_required,
          order_index: index,
        }))
      );
      toast.success('템플릿을 불러왔습니다.');
    }
  };

  const createFormMutation = useMutation({
    mutationFn: async () => {
      // Create the form
      const { data: form, error: formError } = await supabase
        .from('application_forms')
        .insert({
          lecture_id: lectureId,
          speaker_id: speakerId,
          title,
          description,
          is_active: true,
        })
        .select()
        .single();

      if (formError) throw formError;

      // Create questions
      if (questions.length > 0) {
        const questionsToInsert = questions.map((q) => ({
          form_id: form.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options && q.options.length > 0 ? q.options : null,
          has_other: q.has_other || false,
          is_required: q.is_required,
          order_index: q.order_index,
        }));

        const { error: questionsError } = await supabase
          .from('form_questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      return form;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-forms'] });
      onOpenChange(false);
      resetForm();
      toast.success('세미나 신청서가 생성되었습니다.');
    },
    onError: (error) => {
      toast.error('신청서 생성 실패: ' + error.message);
    },
  });

  const updateFormMutation = useMutation({
    mutationFn: async () => {
      if (!existingFormId) throw new Error('수정할 신청서가 없습니다.');

      // Update the form
      const { error: formError } = await supabase
        .from('application_forms')
        .update({
          title,
          description,
        })
        .eq('id', existingFormId);

      if (formError) throw formError;

      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('form_questions')
        .delete()
        .eq('form_id', existingFormId);

      if (deleteError) throw deleteError;

      // Create new questions
      if (questions.length > 0) {
        const questionsToInsert = questions.map((q) => ({
          form_id: existingFormId,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options && q.options.length > 0 ? q.options : null,
          has_other: q.has_other || false,
          is_required: q.is_required,
          order_index: q.order_index,
        }));

        const { error: questionsError } = await supabase
          .from('form_questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-forms'] });
      queryClient.invalidateQueries({ queryKey: ['application-form-detail'] });
      onOpenChange(false);
      toast.success('세미나 신청서가 수정되었습니다.');
    },
    onError: (error) => {
      toast.error('신청서 수정 실패: ' + error.message);
    },
  });

  const resetForm = () => {
    setTitle(`${lectureTitle} 세미나 신청서`);
    setDescription('');
    setQuestions(
      defaultQuestions.map((q) => ({ ...q, id: crypto.randomUUID() }))
    );
    setIsEditMode(false);
    setSelectedTemplateId('');
  };

  const handleSubmit = () => {
    if (isEditMode) {
      updateFormMutation.mutate();
    } else {
      createFormMutation.mutate();
    }
  };

  const isPending = createFormMutation.isPending || updateFormMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? '세미나 신청서 수정' : '세미나 신청서 작성'}
          </DialogTitle>
          <DialogDescription>
            수강생들이 작성할 신청서 양식을 만드세요.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Template selection - only show when creating new */}
            {!isEditMode && allForms && allForms.length > 0 && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <Label className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  기존 신청서 불러오기
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedTemplateId}
                    onValueChange={setSelectedTemplateId}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="다른 클래스의 신청서 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {allForms.map((form: any) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.title} ({(form.lectures as any)?.title})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => loadTemplate(selectedTemplateId)}
                    disabled={!selectedTemplateId}
                  >
                    불러오기
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="formTitle">신청서 제목</Label>
              <Input
                id="formTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="세미나 신청서"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="formDescription">설명 (선택)</Label>
              <Textarea
                id="formDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="신청서에 대한 설명을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label>질문 목록</Label>
              <FormBuilder questions={questions} onQuestionsChange={setQuestions} />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title || questions.length === 0 || isPending}
          >
            {isPending
              ? isEditMode
                ? '수정 중...'
                : '생성 중...'
              : isEditMode
              ? '신청서 수정'
              : '신청서 만들기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
