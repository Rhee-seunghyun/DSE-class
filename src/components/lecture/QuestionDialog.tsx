import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquarePlus, Send, Loader2, History, CheckCircle2, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface QuestionDialogProps {
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

export function QuestionDialog({ lectureId, lectureTitle }: QuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myQuestions, isLoading } = useQuery({
    queryKey: ['my-questions', lectureId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lecture_questions')
        .select('*')
        .eq('lecture_id', lectureId)
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LectureQuestion[];
    },
    enabled: !!lectureId && !!user?.id && open,
  });

  const submitQuestionMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from('lecture_questions')
        .insert({
          lecture_id: lectureId,
          student_id: user!.id,
          student_name: profile?.full_name || '익명',
          question_text: text,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-questions', lectureId, user?.id] });
      setQuestionText('');
      toast({
        title: '질문 전송 완료',
        description: '질문이 성공적으로 전송되었습니다.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: '전송 실패',
        description: '질문 전송 중 오류가 발생했습니다.',
      });
    },
  });

  const handleSubmit = () => {
    if (!questionText.trim()) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '질문 내용을 입력해주세요.',
      });
      return;
    }
    submitQuestionMutation.mutate(questionText.trim());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquarePlus className="w-4 h-4" />
          <span className="hidden sm:inline">질문하기</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5" />
            질문하기
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="write" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="write" className="gap-2">
              <Send className="w-4 h-4" />
              질문 작성
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              내 질문 이력
            </TabsTrigger>
          </TabsList>

          <TabsContent value="write" className="flex-1 flex flex-col gap-4 mt-4">
            <div className="text-sm text-muted-foreground">
              <strong>{lectureTitle}</strong> 강의에 대해 질문해주세요.
            </div>
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="질문 내용을 입력하세요..."
              className="flex-1 min-h-[150px] resize-none"
            />
            <Button 
              onClick={handleSubmit} 
              disabled={submitQuestionMutation.isPending || !questionText.trim()}
              className="w-full"
            >
              {submitQuestionMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              질문 전송
            </Button>
          </TabsContent>

          <TabsContent value="history" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[300px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !myQuestions || myQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  아직 작성한 질문이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {myQuestions.map((question) => (
                    <div 
                      key={question.id} 
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(question.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                        </span>
                        {question.is_answered ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            답변 완료
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="w-3 h-3" />
                            답변 대기
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{question.question_text}</p>
                    </div>
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
