import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ChevronRight } from 'lucide-react';
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
      
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.email,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">내 강의</h1>
          <p className="text-muted-foreground mt-1">
            수강 가능한 강의 목록입니다.
          </p>
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
                    <Badge variant="secondary">수강 중</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {lecture.description || '강의 설명이 없습니다.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={`/lecture/${lecture.id}`}>
                    <Button className="w-full" variant="default">
                      강의실 입장
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
              <p className="text-muted-foreground text-center">
                수강 가능한 강의가 없습니다.
                <br />
                연자가 수강생으로 등록하면 강의가 표시됩니다.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
