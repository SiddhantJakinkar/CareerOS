import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, Search, User } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store';
import { notificationApi, authApi } from '@/services/endpoints';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function TopNavbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const res = await notificationApi.getUnreadCount();
      return res.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    refetchInterval: 120 * 1000,
    retry: false,
  });

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-[72px] items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl transition-all duration-300',
        sidebarCollapsed ? 'left-[80px]' : 'left-[280px]'
      )}
    >
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          placeholder="Search jobs, skills..."
          className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              navigate(`/jobs?search=${(e.target as HTMLInputElement).value}`);
            }
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')}>
          <Bell className="h-5 w-5" />
          {(unreadData?.count ?? 0) > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {unreadData!.count}
            </span>
          )}
        </Button>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-text-primary">{user?.name}</p>
            <p className="text-xs text-text-muted">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
