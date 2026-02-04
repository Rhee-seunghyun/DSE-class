import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, logSecurityEvent } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useCaptureProtection } from '@/hooks/useCaptureProtection';
import { DynamicWatermark } from '@/components/DynamicWatermark';
import { StudentMaterialsSection } from '@/components/lecture/StudentMaterialsSection';
import { CaptureWarningDialog } from '@/components/security/CaptureWarningDialog';

export default function LectureRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  const { data: lecture, isLoading: lectureLoading } = useQuery({
    queryKey: ['lecture', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // 캡처 방지 활성화
  const { showWarningDialog, dismissWarningDialog } = useCaptureProtection({
    enabled: true,
    lectureId: id,
    lectureTitle: lecture?.title,
  });

  const { data: existingNote, isLoading: noteLoading } = useQuery({
    queryKey: ['lecture-note', id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lecture_notes')
        .select('*')
        .eq('lecture_id', id)
        .eq('student_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  useEffect(() => {
    if (existingNote) {
      setNotes(existingNote.content);
    }
  }, [existingNote]);

  // 강의실 입장 로그
  useEffect(() => {
    if (user && id && lecture) {
      logSecurityEvent(
        user.id,
        id,
        'lecture_access',
        lecture.title,
        profile?.email
      );
    }
  }, [user, id, lecture, profile]);

  const saveNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (existingNote) {
        const { error } = await supabase
          .from('lecture_notes')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', existingNote.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lecture_notes')
          .insert({
            lecture_id: id!,
            student_id: user!.id,
            content,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecture-note', id, user?.id] });
      toast({
        title: '저장 완료',
        description: '노트가 저장되었습니다.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '노트 저장 중 오류가 발생했습니다.',
      });
    },
  });

  const handleSaveNotes = () => {
    saveNoteMutation.mutate(notes);
  };

  if (lectureLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lecture) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">강의를 찾을 수 없습니다.</p>
          <Button onClick={() => navigate('/my-lectures')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            강의 목록으로
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DynamicWatermark />
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/my-lectures')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{lecture.title}</h1>
              <p className="text-muted-foreground">{lecture.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDF Viewer - Now using StudentMaterialsSection */}
          <StudentMaterialsSection lectureId={id!} />

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>내 노트</span>
                <Button 
                  size="sm" 
                  onClick={handleSaveNotes}
                  disabled={saveNoteMutation.isPending}
                >
                  {saveNoteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  저장
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {noteLoading ? (
                <Skeleton className="h-[500px] w-full" />
              ) : (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="강의를 들으며 메모를 작성하세요..."
                  className="h-[500px] resize-none"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Capture Warning Dialog */}
      <CaptureWarningDialog
        open={showWarningDialog}
        onConfirm={dismissWarningDialog}
      />
    </DashboardLayout>
  );
}
