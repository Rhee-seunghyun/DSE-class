import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Shield, 
  LogOut,
  FileText,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { 
      href: '/dashboard', 
      label: '대시보드', 
      icon: LayoutDashboard,
      roles: ['master', 'speaker', 'student'] 
    },
    { 
      href: '/lectures', 
      label: '강의 관리', 
      icon: BookOpen,
      roles: ['speaker'] 
    },
    { 
      href: '/my-lectures', 
      label: '내 강의', 
      icon: FileText,
      roles: ['student'] 
    },
    { 
      href: '/whitelist', 
      label: '수강생 관리', 
      icon: Users,
      roles: ['speaker'] 
    },
    { 
      href: '/speakers', 
      label: '연자 관리', 
      icon: Users,
      roles: ['master'] 
    },
    { 
      href: '/security-logs', 
      label: '보안 로그', 
      icon: Shield,
      roles: ['master', 'speaker'] 
    },
    { 
      href: '/settings', 
      label: '설정', 
      icon: Settings,
      roles: ['master', 'speaker', 'student'] 
    },
  ];

  const filteredNavItems = navItems.filter(
    item => role && item.roles.includes(role)
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <Logo size="sm" />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.full_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
