import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ChevronRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyLectures() {
  const { profile } = useAuth();

  const { data: lectures, isLoading } = useQuery({
    queryKey: ['my-lectures', profile?.email],
    queryFn: async () => {
      if (!profile?.email) return [];
      
      const { data: whitelistData, error: whitelistError } = await supabase
        .from('whitelist')
        .select('lecture_id')
        .eq('email', profile.email)
        .eq('is_registered', true);

      if (whitelistError) throw whitelistError;
      if (!whitelistData || whitelistData.length === 0) return [];

      const lectureIds = whitelistData.map(w => w.lecture_id);

      const { data: lecturesData, error: lecturesError } = await supabase
        .from('lectures')
        .select('*')
        .in('id', lectureIds)
        .eq('is_active', true);

      if (lecturesError) throw lecturesError;
      return lecturesData || [];
    },
    enabled: !!profile?.email,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Card className="border-2">
          <CardHeader className="pb-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">My class</CardTitle>
                <CardDescription>
                  승인된 강의 목록입니다. 강의를 클릭하여 자료를 확인하세요.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : lectures && lectures.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lectures.map((lecture) => (
                  <Link key={lecture.id} to={`/lecture/${lecture.id}`} className="block p-4 border rounded-lg hover:border-primary hover:bg-accent/50 transition-all group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {lecture.title}
                        </h3>
                      </div>
                      <Badge variant="secondary" className="text-xs">수강 중</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {lecture.description || '강의 설명이 없습니다.'}
                    </p>
                    <div className="flex items-center justify-end text-sm text-primary">
                      <span>강의실 입장</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  수강 가능한 강의가 없습니다.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  연자가 수강생으로 등록하면 강의가 표시됩니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}