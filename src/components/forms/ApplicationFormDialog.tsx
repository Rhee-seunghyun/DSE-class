import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormBuilder, FormQuestion } from './FormBuilder';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lectureId: string;
  speakerId: string;
  lectureTitle: string;
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  lectureId,
  speakerId,
  lectureTitle,
}: ApplicationFormDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(`${lectureTitle} 세미나 신청서`);
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<FormQuestion[]>([
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
  ]);

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

  const resetForm = () => {
    setTitle(`${lectureTitle} 세미나 신청서`);
    setDescription('');
    setQuestions([
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
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>세미나 신청서 작성</DialogTitle>
          <DialogDescription>
            수강생들이 작성할 신청서 양식을 만드세요.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
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
            onClick={() => createFormMutation.mutate()}
            disabled={!title || questions.length === 0 || createFormMutation.isPending}
          >
            {createFormMutation.isPending ? '생성 중...' : '신청서 만들기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
