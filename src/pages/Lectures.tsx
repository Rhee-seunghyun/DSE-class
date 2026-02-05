import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Plus, 
  ChevronRight, 
  MoreVertical,
  Pencil,
  Trash2,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

export default function Lectures() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { data: lectures, isLoading } = useQuery({
    queryKey: ['speaker-lectures', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .eq('speaker_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: whitelistCounts } = useQuery({
    queryKey: ['whitelist-counts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whitelist')
        .select('lecture_id')
        .eq('speaker_id', user?.id);

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        counts[item.lecture_id] = (counts[item.lecture_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (lectureId: string) => {
      const { error } = await supabase
        .from('lectures')
        .delete()
        .eq('id', lectureId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speaker-lectures'] });
      toast({
        title: '삭제 완료',
        description: '강의가 삭제되었습니다.',
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: '강의 삭제 중 오류가 발생했습니다.',
      });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">강의 관리</h1>
            <p className="text-muted-foreground mt-1">
              강의를 생성하고 관리하세요.
            </p>
          </div>
          <Link to="/lectures/new">
              <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              새 강의 만들기
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : lectures && lectures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lectures.map((lecture) => (
              <Card key={lecture.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{lecture.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={lecture.is_active ? 'default' : 'secondary'}>
                        {lecture.is_active ? '활성' : '비활성'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/lectures/${lecture.id}`}>
                              <Pencil className="w-4 h-4 mr-2" />
                              편집
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/whitelist?lecture=${lecture.id}`}>
                              <Users className="w-4 h-4 mr-2" />
                              수강생 관리
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteId(lecture.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {lecture.description || '강의 설명이 없습니다.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      수강생 {whitelistCounts?.[lecture.id] || 0}명
                    </span>
                    <span>
                      {new Date(lecture.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <Link to={`/lectures/${lecture.id}`}>
                    <Button className="w-full" variant="outline">
                      강의 관리
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                아직 등록된 강의가 없습니다.
                <br />
                새 강의를 만들어 시작하세요.
              </p>
              <Link to="/lectures/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  새 강의 만들기
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>강의를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 강의와 관련된 모든 데이터가 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
