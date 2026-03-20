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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import doableLogo from '@/assets/doable-logo-new.png';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { href: '/my-class', label: 'My class', icon: Presentation, roles: ['master', 'speaker'] },
    { href: '/speakers', label: 'Speaker 관리', icon: Mic, roles: ['master'] },
    { href: '/staff', label: 'Staff 관리', icon: UserCog, roles: ['master'] },
    { href: '/my-lectures', label: 'My class', icon: BookOpen, roles: ['student'] },
    { href: '/settings', label: '설정', icon: Settings, roles: ['master', 'speaker', 'student', 'staff'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!role) return false;
    const effectiveRole = role === 'staff' ? 'master' : role;
    return item.roles.includes(effectiveRole) || item.roles.includes(role);
  });

  const NavContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      <nav className="flex-1 py-8 px-2 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          const linkEl = (
            <Link
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={1.5} />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }
          return <div key={item.href}>{linkEl}</div>;
        })}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className={cn(
                "w-full gap-3 text-muted-foreground hover:text-foreground",
                collapsed ? "justify-center px-0" : "justify-start px-3"
              )}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>로그아웃</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">로그아웃</TooltipContent>}
        </Tooltip>
      </div>
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex w-full">
        {isMobile && (
          <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border flex items-center justify-between px-4 z-50">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-56 p-0 bg-sidebar flex flex-col">
                <NavContent collapsed={false} />
              </SheetContent>
            </Sheet>
            <img src={doableLogo} alt="DoABLE" className="h-6" />
            <div className="w-10" />
          </header>
        )}

        {!isMobile && (
          <aside
            className={cn(
              "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-all duration-300 overflow-hidden",
              sidebarExpanded ? "w-56" : "w-14"
            )}
            onMouseEnter={() => setSidebarExpanded(true)}
            onMouseLeave={() => setSidebarExpanded(false)}
          >
            <NavContent collapsed={!sidebarExpanded} />
          </aside>
        )}

        <main className={cn(
          "flex-1 overflow-auto grid-pattern transition-all duration-300",
          isMobile ? "mt-14" : "ml-14"
        )}>
          <div className={cn("absolute top-6 right-8 z-30", isMobile && "hidden")}>
            <img src={doableLogo} alt="DoABLE" className="h-8" />
          </div>
          <div className={cn("p-4 sm:p-8", !isMobile && "pt-16")}>
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
