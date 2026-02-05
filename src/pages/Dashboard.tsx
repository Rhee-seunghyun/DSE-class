import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Shield, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Dashboard() {
  const { profile, role } = useAuth();
  const navigate = useNavigate();

  // Redirect master/speaker to my-class, student to my-lectures
  useEffect(() => {
     if (role === 'master' || role === 'staff' || role === 'speaker') {
      navigate('/my-class', { replace: true });
    } else if (role === 'student') {
      navigate('/my-lectures', { replace: true });
    }
  }, [role, navigate]);

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'master': return '관리자';
       case 'staff': return '스태프';
      case 'speaker': return '연자';
      case 'student': return '수강생';
      default: return '미정';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            안녕하세요, {profile?.full_name}님
          </h1>
          <p className="text-muted-foreground mt-1">
            {getRoleLabel(role)}로 로그인되었습니다.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {role === 'speaker' && (
            <>
              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    내 강의
                  </CardTitle>
                  <BookOpen className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    등록된 강의 수
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    수강생
                  </CardTitle>
                  <Users className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    화이트리스트 등록
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    보안 이벤트
                  </CardTitle>
                  <Shield className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    최근 7일간
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {role === 'student' && (
            <>
              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    수강 강의
                  </CardTitle>
                  <FileText className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    접근 가능한 강의
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    내 노트
                  </CardTitle>
                  <BookOpen className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    작성한 강의 노트
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {role === 'master' && (
            <>
              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    총 연자
                  </CardTitle>
                  <Users className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    등록된 연자 수
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    총 강의
                  </CardTitle>
                  <BookOpen className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    등록된 강의 수
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    보안 이벤트
                  </CardTitle>
                  <Shield className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    최근 7일간
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Recent Activity */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>
              최근 강의 및 보안 관련 활동 내역입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              아직 활동 내역이 없습니다.
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
