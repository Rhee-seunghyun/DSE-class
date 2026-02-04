import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ApplicationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formResponseId: string | null;
  studentName: string | null;
  studentEmail: string;
}

interface FormQuestion {
  id: string;
  question_text: string;
  question_type: string;
  order_index: number;
}

export function ApplicationDetailDialog({
  open,
  onOpenChange,
  formResponseId,
  studentName,
  studentEmail,
}: ApplicationDetailDialogProps) {
  // Fetch the form response
  const { data: response, isLoading: responseLoading } = useQuery({
    queryKey: ['form-response-detail', formResponseId],
    queryFn: async () => {
      if (!formResponseId) return null;
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('id', formResponseId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!formResponseId,
  });

  // Fetch questions for the form
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['form-questions-for-response', response?.form_id],
    queryFn: async () => {
      if (!response?.form_id) return [];
      const { data, error } = await supabase
        .from('form_questions')
        .select('*')
        .eq('form_id', response.form_id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as FormQuestion[];
    },
    enabled: open && !!response?.form_id,
  });

  const isLoading = responseLoading || questionsLoading;

  const formatAnswer = (answer: unknown): string => {
    if (answer === null || answer === undefined) return '-';
    if (typeof answer === 'object' && answer !== null) {
      const answerObj = answer as { selected?: string; otherText?: string };
      if (answerObj.otherText) {
        return `${answerObj.selected} - ${answerObj.otherText}`;
      }
      return answerObj.selected || '-';
    }
    return String(answer);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            신청서 상세
            {studentName && (
              <Badge variant="secondary">{studentName}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {!formResponseId ? (
            <div className="text-center py-8 text-muted-foreground">
              신청서 정보가 없습니다.
            </div>
          ) : isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : !response ? (
            <div className="text-center py-8 text-muted-foreground">
              신청서를 찾을 수 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="space-y-2 pb-4 border-b">
                <div>
                  <span className="text-sm text-muted-foreground">이름:</span>
                  <p className="font-medium">{response.applicant_name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">이메일:</span>
                  <p className="font-medium">{response.applicant_email}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">면허번호:</span>
                  <p className="font-medium">{response.license_number || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">신청일:</span>
                  <p className="font-medium">
                    {new Date(response.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Question Answers */}
              {questions && questions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">신청서 응답</h4>
                  {questions.map((question) => {
                    if (question.question_type === 'description') return null;
                    const answers = response.answers as Record<string, unknown>;
                    const answer = answers[question.id];
                    
                    return (
                      <div key={question.id} className="space-y-1">
                        <span className="text-sm text-muted-foreground">
                          {question.question_text}
                        </span>
                        <p className="text-sm font-medium bg-muted/50 rounded px-2 py-1">
                          {formatAnswer(answer)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
