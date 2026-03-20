import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, logSecurityEvent } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import { useCaptureProtection } from '@/hooks/useCaptureProtection';
import { StudentMaterialsSectionBlob } from '@/components/lecture/StudentMaterialsSectionBlob';
import { CaptureWarningDialog } from '@/components/security/CaptureWarningDialog';


export default function LectureRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const materialRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const toggleFullscreen = () => {
    if (!materialRef.current) return;
    if (!document.fullscreenElement) {
      materialRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

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
      <div className="h-[calc(100vh-120px)] flex flex-col animate-fade-in">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/my-lectures')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">{lecture.title}</h1>
            </div>
          </div>
        </div>

        {/* Full-size PDF Viewer */}
        <div className="flex-1 min-h-0 rounded-lg border overflow-hidden">
          <div ref={materialRef} className="h-full bg-background">
            <div className="h-full relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-30 h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={toggleFullscreen}
                title={isFullscreen ? "전체화면 종료" : "전체화면"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>
              <StudentMaterialsSectionBlob lectureId={id!} lectureTitle={lecture.title} />
            </div>
          </div>
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
