import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ApplicationStatisticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lectureId: string;
}

interface FormQuestion {
  id: string;
  question_text: string;
  question_type: string;
  order_index: number;
  options: string[] | null;
}

interface FormResponse {
  id: string;
  answers: Record<string, unknown>;
}

export function ApplicationStatisticsDialog({
  open,
  onOpenChange,
  lectureId,
}: ApplicationStatisticsDialogProps) {
  // Fetch the application form for this lecture
  const { data: form } = useQuery({
    queryKey: ['application-form-for-stats', lectureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('application_forms')
        .select('*')
        .eq('lecture_id', lectureId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: open && !!lectureId,
  });

  // Fetch questions
  const { data: questions } = useQuery({
    queryKey: ['form-questions-for-stats', form?.id],
    queryFn: async () => {
      if (!form?.id) return [];
      const { data, error } = await supabase
        .from('form_questions')
        .select('*')
        .eq('form_id', form.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as FormQuestion[];
    },
    enabled: open && !!form?.id,
  });

  // Fetch all responses
  const { data: responses, isLoading } = useQuery({
    queryKey: ['form-responses-for-stats', form?.id],
    queryFn: async () => {
      if (!form?.id) return [];
      const { data, error } = await supabase
        .from('form_responses')
        .select('id, answers')
        .eq('form_id', form.id);

      if (error) throw error;
      return data as FormResponse[];
    },
    enabled: open && !!form?.id,
  });

  // Calculate statistics for each question
  const getQuestionStats = (question: FormQuestion) => {
    if (!responses || responses.length === 0) return null;

    const answerCounts: Record<string, number> = {};
    let totalAnswers = 0;

    responses.forEach((response) => {
      const answer = response.answers[question.id];
      if (answer === undefined || answer === null) return;

      let answerValue: string;
      if (typeof answer === 'object' && answer !== null) {
        const answerObj = answer as { selected?: string; otherText?: string };
        if (answerObj.otherText) {
          answerValue = '기타';
        } else {
          answerValue = answerObj.selected || '';
        }
      } else {
        answerValue = String(answer);
      }

      if (answerValue) {
        answerCounts[answerValue] = (answerCounts[answerValue] || 0) + 1;
        totalAnswers++;
      }
    });

    return { counts: answerCounts, total: totalAnswers };
  };

  const totalResponses = responses?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>신청서 통계</DialogTitle>
          <DialogDescription>
            총 {totalResponses}명의 신청서 응답 통계
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {!form ? (
            <div className="text-center py-8 text-muted-foreground">
              신청서가 없습니다.
            </div>
          ) : isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : !responses || responses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              응답이 없습니다.
            </div>
          ) : (
            <div className="space-y-6">
              {questions?.map((question) => {
                // Skip description type questions
                if (question.question_type === 'description') return null;
                
                const stats = getQuestionStats(question);
                if (!stats) return null;

                const isMultipleChoice = question.question_type === 'multiple_choice';

                return (
                  <div key={question.id} className="space-y-3 pb-4 border-b last:border-b-0">
                    <h4 className="font-medium text-sm">
                      {question.question_text}
                    </h4>
                    
                    {isMultipleChoice ? (
                      <div className="space-y-2">
                        {Object.entries(stats.counts)
                          .sort((a, b) => b[1] - a[1])
                          .map(([answer, count]) => {
                            const percentage = Math.round((count / stats.total) * 100);
                            return (
                              <div key={answer} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="truncate max-w-[70%]">{answer}</span>
                                  <span className="text-muted-foreground">
                                    {count}명 ({percentage}%)
                                  </span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            응답: {stats.total}명
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            (미응답: {totalResponses - stats.total}명)
                          </span>
                        </div>
                        {Object.keys(stats.counts).length <= 10 && (
                          <div className="mt-2 space-y-1">
                            {Object.entries(stats.counts)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 10)
                              .map(([answer, count]) => (
                                <div key={answer} className="text-sm flex justify-between bg-muted/50 rounded px-2 py-1">
                                  <span className="truncate max-w-[80%]">{answer}</span>
                                  <span className="text-muted-foreground">{count}명</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
