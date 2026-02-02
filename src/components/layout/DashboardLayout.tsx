import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  LogOut,
  Presentation,
  Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';
import doableLogo from '@/assets/doable-logo-new.png';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Navigation items based on role
  const navItems = [
    { 
      href: '/my-class', 
      label: 'My class', 
      icon: Presentation,
      roles: ['master', 'speaker'] 
    },
    { 
      href: '/speakers', 
      label: 'Speaker 관리', 
      icon: Mic,
      roles: ['master'] 
    },
    { 
      href: '/my-lectures', 
      label: 'My class', 
      icon: BookOpen,
      roles: ['student'] 
    },
  ];

  const filteredNavItems = navItems.filter(
    item => role && item.roles.includes(role)
  );

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar - hover to expand */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-all duration-300 ease-in-out",
          isExpanded ? "w-56" : "w-16"
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Nav items */}
        <nav className="flex-1 py-8 px-2 space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium overflow-hidden',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={1.5} />
                <span className={cn(
                  "whitespace-nowrap transition-opacity duration-200",
                  isExpanded ? "opacity-100" : "opacity-0"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User info & logout at bottom */}
        <div className="p-2 border-t border-sidebar-border">
          {isExpanded && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.email}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={cn(
              "w-full gap-3 text-muted-foreground hover:text-foreground transition-all duration-200",
              isExpanded ? "justify-start px-3" : "justify-center px-0"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span>로그아웃</span>}
          </Button>
        </div>
      </aside>

      {/* Main content with grid pattern */}
      <main className={cn(
        "flex-1 overflow-auto grid-pattern transition-all duration-300",
        isExpanded ? "ml-56" : "ml-16"
      )}>
        {/* Logo positioned in top-right */}
        <div className="absolute top-6 right-8 z-30">
          <img src={doableLogo} alt="DoABLE" className="h-8" />
        </div>
        
        <div className="p-8 pt-16">
          {children}
        </div>
      </main>
    </div>
  );
}
