import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Eye } from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FormResponsesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  formTitle: string;
  lectureId: string;
  speakerId: string;
}

interface FormResponse {
  id: string;
  applicant_name: string;
  applicant_email: string;
  license_number: string | null;
  answers: Record<string, string>;
  status: string;
  created_at: string;
}

export function FormResponsesDialog({
  open,
  onOpenChange,
  formId,
  formTitle,
  lectureId,
  speakerId,
}: FormResponsesDialogProps) {
  const queryClient = useQueryClient();
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);

  const { data: responses, isLoading } = useQuery({
    queryKey: ['form-responses', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', formId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FormResponse[];
    },
    enabled: open && !!formId,
  });

  const { data: questions } = useQuery({
    queryKey: ['form-questions', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_questions')
        .select('*')
        .eq('form_id', formId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: open && !!formId,
  });

  const approveResponseMutation = useMutation({
    mutationFn: async (response: FormResponse) => {
      // Update response status
      const { error: updateError } = await supabase
        .from('form_responses')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', response.id);

      if (updateError) throw updateError;

      // Add to whitelist
      const { error: whitelistError } = await supabase
        .from('whitelist')
        .insert({
          lecture_id: lectureId,
          speaker_id: speakerId,
          email: response.applicant_email,
          student_name: response.applicant_name,
          license_number: response.license_number,
        });

      if (whitelistError) {
        // If already exists, that's okay
        if (!whitelistError.message.includes('duplicate')) {
          throw whitelistError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-responses'] });
      queryClient.invalidateQueries({ queryKey: ['lecture-students'] });
      toast.success('신청이 승인되었습니다. 수강생 목록에 추가되었습니다.');
    },
    onError: (error) => {
      toast.error('승인 실패: ' + error.message);
    },
  });

  const rejectResponseMutation = useMutation({
    mutationFn: async (responseId: string) => {
      const { error } = await supabase
        .from('form_responses')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', responseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-responses'] });
      toast.success('신청이 거절되었습니다.');
    },
    onError: (error) => {
      toast.error('거절 실패: ' + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">승인됨</Badge>;
      case 'rejected':
        return <Badge variant="destructive">거절됨</Badge>;
      default:
        return <Badge variant="secondary">대기중</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{formTitle} - 신청 목록</DialogTitle>
            <DialogDescription>
              수강 신청서를 확인하고 승인/거절할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
            ) : !responses || responses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                아직 신청서가 없습니다.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>면허번호</TableHead>
                    <TableHead>신청일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="w-32"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>{response.applicant_name}</TableCell>
                      <TableCell>{response.applicant_email}</TableCell>
                      <TableCell>{response.license_number || '-'}</TableCell>
                      <TableCell>
                        {new Date(response.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>{getStatusBadge(response.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedResponse(response)}
                            title="상세 보기"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {response.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => approveResponseMutation.mutate(response)}
                                className="text-primary hover:text-primary"
                                title="승인"
                                disabled={approveResponseMutation.isPending}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => rejectResponseMutation.mutate(response.id)}
                                className="text-destructive hover:text-destructive"
                                title="거절"
                                disabled={rejectResponseMutation.isPending}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Response Detail Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>신청서 상세</DialogTitle>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">이름:</span>
                <p className="font-medium">{selectedResponse.applicant_name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">이메일:</span>
                <p className="font-medium">{selectedResponse.applicant_email}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">면허번호:</span>
                <p className="font-medium">{selectedResponse.license_number || '-'}</p>
              </div>
              {questions && Object.entries(selectedResponse.answers).map(([questionId, answer]) => {
                const question = questions.find((q) => q.id === questionId);
                return (
                  <div key={questionId}>
                    <span className="text-sm text-muted-foreground">
                      {question?.question_text || '질문'}:
                    </span>
                    <p className="font-medium">{answer || '-'}</p>
                  </div>
                );
              })}
              <div>
                <span className="text-sm text-muted-foreground">상태:</span>
                <div className="mt-1">{getStatusBadge(selectedResponse.status)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
