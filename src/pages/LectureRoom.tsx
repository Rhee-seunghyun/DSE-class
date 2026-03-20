import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase, logSecurityEvent } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useRef } from 'react';
import { useCaptureProtection } from '@/hooks/useCaptureProtection';
import { StudentMaterialsSectionBlob } from '@/components/lecture/StudentMaterialsSectionBlob';
import { CaptureWarningDialog } from '@/components/security/CaptureWarningDialog';

export default function LectureRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const materialRef = useRef<HTMLDivElement>(null);

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

  const { showWarningDialog, dismissWarningDialog } = useCaptureProtection({
    enabled: true,
    lectureId: id,
    lectureTitle: lecture?.title,
  });

  // 강의실 입장 로그
  useEffect(() => {
    if (user && id && lecture) {
      logSecurityEvent(user.id, id, 'lecture_access', lecture.title, profile?.email);
    }
  }, [user, id, lecture, profile]);

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
      <div className="h-[calc(100vh-80px)] flex flex-col animate-fade-in -mx-2 sm:-mx-4">
        {/* Compact Header */}
        <div className="flex items-center gap-1 px-2 py-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => navigate('/my-lectures')}>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
          <h1 className="text-xs sm:text-sm font-semibold text-foreground truncate ml-1">{lecture.title}</h1>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div ref={materialRef} className="h-full bg-background">
            <StudentMaterialsSectionBlob lectureId={id!} lectureTitle={lecture.title} isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />
          </div>
        </div>
      </div>

      <CaptureWarningDialog
        open={showWarningDialog}
        onConfirm={dismissWarningDialog}
      />
    </DashboardLayout>
  );
}
