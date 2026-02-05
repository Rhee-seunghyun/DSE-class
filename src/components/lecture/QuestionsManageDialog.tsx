import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface QuestionsManageDialogProps {
  lectureId: string;
  lectureTitle: string;
}

interface LectureQuestion {
  id: string;
  lecture_id: string;
  student_id: string;
  student_name: string;
  question_text: string;
  is_answered: boolean;
  answered_by: string | null;
  answered_at: string | null;
  created_at: string;
}

export function QuestionsManageDialog({ lectureId, lectureTitle }: QuestionsManageDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: questions, isLoading } = useQuery({
    queryKey: ['lecture-questions', lectureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lecture_questions')
        .select('*')
        .eq('lecture_id', lectureId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as LectureQuestion[];
    },
    enabled: !!lectureId && open,
  });

  const markAsAnsweredMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase
        .from('lecture_questions')
        .update({
          is_answered: true,
          answered_by: user?.id,
          answered_at: new Date().toISOString(),
        })
        .eq('id', questionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecture-questions', lectureId] });
      toast({
        title: '답변 완료',
        description: '질문이 답변 완료 처리되었습니다.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: '처리 실패',
        description: '답변 완료 처리 중 오류가 발생했습니다.',
      });
    },
  });

  const pendingQuestions = questions?.filter(q => !q.is_answered) || [];
  const answeredQuestions = questions?.filter(q => q.is_answered) || [];

  const QuestionCard = ({ question, showAnswerButton }: { question: LectureQuestion; showAnswerButton?: boolean }) => (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{question.student_name}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(question.created_at), 'MM.dd HH:mm', { locale: ko })}
            </span>
          </div>
        </div>
        {question.is_answered ? (
          <Badge variant="default" className="gap-1 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            완료
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            대기
          </Badge>
        )}
      </div>
      <p className="text-sm whitespace-pre-wrap mb-3">{question.question_text}</p>
      {showAnswerButton && !question.is_answered && (
        <Button
          size="sm"
          onClick={() => markAsAnsweredMutation.mutate(question.id)}
          disabled={markAsAnsweredMutation.isPending}
          className="w-full sm:w-auto"
        >
          {markAsAnsweredMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          )}
          답변 완료
        </Button>
      )}
      {question.is_answered && question.answered_at && (
        <div className="text-xs text-muted-foreground">
          답변 완료: {format(new Date(question.answered_at), 'MM.dd HH:mm', { locale: ko })}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">질문받기</span>
          {pendingQuestions.length > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
              {pendingQuestions.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            질문 관리 - {lectureTitle}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="pending" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              답변 대기 ({pendingQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="answered" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              답변 완료 ({answeredQuestions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : pendingQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  대기 중인 질문이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingQuestions.map((question) => (
                    <QuestionCard 
                      key={question.id} 
                      question={question} 
                      showAnswerButton 
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="answered" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : answeredQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  답변 완료된 질문이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {answeredQuestions.map((question) => (
                    <QuestionCard key={question.id} question={question} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
