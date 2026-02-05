import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  LogOut,
  Presentation,
  Mic,
  UserCog,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import doableLogo from '@/assets/doable-logo-new.png';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
       href: '/staff', 
       label: 'Staff 관리', 
       icon: UserCog,
       roles: ['master'] 
     },
    { 
      href: '/my-lectures', 
      label: 'My class', 
      icon: BookOpen,
       roles: ['student']
     },
     { 
       href: '/settings', 
       label: '설정', 
       icon: Settings,
       roles: ['master', 'speaker', 'student', 'staff']
    },
  ];

  const filteredNavItems = navItems.filter(
     item => {
       if (!role) return false;
       // staff has same access as master for navigation
       const effectiveRole = role === 'staff' ? 'master' : role;
       return item.roles.includes(effectiveRole) || item.roles.includes(role);
     }
  );

  const NavContent = () => (
    <>
      {/* Nav items */}
      <nav className="flex-1 py-8 px-2 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info & logout at bottom */}
      <div className="p-2 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-2">
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
          className="w-full gap-3 text-muted-foreground hover:text-foreground justify-start px-3"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>로그아웃</span>
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex w-full">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border flex items-center justify-between px-4 z-50">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-0 bg-sidebar flex flex-col">
              <NavContent />
            </SheetContent>
          </Sheet>
          <img src={doableLogo} alt="DoABLE" className="h-6" />
          <div className="w-10" /> {/* Spacer for centering logo */}
        </header>
      )}

      {/* Desktop Sidebar - fixed width, no hover */}
      {!isMobile && (
        <aside className="fixed left-0 top-0 h-full w-56 bg-sidebar border-r border-sidebar-border flex flex-col z-40">
          <NavContent />
        </aside>
      )}

      {/* Main content with grid pattern */}
      <main className={cn(
        "flex-1 overflow-auto grid-pattern",
        isMobile ? "mt-14" : "ml-56"
      )}>
        {/* Logo positioned in top-right */}
        <div className={cn(
          "absolute top-6 right-8 z-30",
          isMobile && "hidden"
        )}>
          <img src={doableLogo} alt="DoABLE" className="h-8" />
        </div>
        
        <div className={cn(
          "p-4 sm:p-8",
          !isMobile && "pt-16"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}