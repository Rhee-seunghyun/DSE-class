import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, BookOpen, Users } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Logo size="sm" />
          <Button 
            onClick={() => navigate('/login')}
            className="brand-gradient"
          >
            로그인
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-12 sm:py-24 lg:py-32">
          <div className="container text-center px-4">
            <div className="animate-fade-in">
              <Logo size="lg" className="mb-8" />
              <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                전문 강연자를 위한 보안 강의 플랫폼.<br />
                강력한 콘텐츠 보호와 편리한 학습 관리를 경험하세요.
              </p>
              <Button 
                size="lg"
                onClick={() => navigate('/login')}
                className="brand-gradient text-lg px-8"
              >
                시작하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 sm:py-24 bg-surface-light">
          <div className="container px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">주요 기능</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
              <div className="bg-card rounded-xl p-6 sm:p-8 shadow-sm border border-border animate-fade-in">
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">강력한 보안</h3>
                <p className="text-muted-foreground">
                  동적 워터마크, 캡처 방지, 보안 로그로 콘텐츠를 안전하게 보호합니다.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 sm:p-8 shadow-sm border border-border animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-6">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">강의 관리</h3>
                <p className="text-muted-foreground">
                  PDF 자료 업로드, 수정, 삭제를 편리하게 관리할 수 있습니다.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 sm:p-8 shadow-sm border border-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">수강생 관리</h3>
                <p className="text-muted-foreground">
                  이메일 화이트리스트로 승인된 수강생만 접근할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-24">
          <div className="container text-center px-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">지금 시작하세요</h2>
            <p className="text-muted-foreground mb-8">
              초대받은 이메일로 로그인하여 강의에 참여하세요.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/login')}
              className="brand-gradient"
            >
              로그인하기
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 DoABLE Dental Sedation Course. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
