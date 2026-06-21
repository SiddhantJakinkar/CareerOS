import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { useUIStore } from '@/store';
import { useProfileBootstrap } from '@/hooks/useProfileBootstrap';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore();
  useProfileBootstrap();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopNavbar />
      <main
        className={cn(
          'min-h-screen pt-[72px] transition-all duration-300',
          sidebarCollapsed ? 'pl-[80px]' : 'pl-[280px]'
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
