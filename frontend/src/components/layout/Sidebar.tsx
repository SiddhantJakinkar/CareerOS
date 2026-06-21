import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  FileText,
  MessageSquare,
  Code,
  Target,
  Map,
  Share2,
  Briefcase,
  BarChart3,
  User,
  ChevronLeft,
  Sparkles,
  Bot,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, useAuthStore } from '@/store';
import { getAssessmentNavLabel } from '@/lib/academicStreams';

const baseStudentNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/career-chat', icon: Bot, label: 'Career Copilot' },
  { to: '/jobs', icon: Search, label: 'Job Search' },
  { to: '/resume-analyzer', icon: FileText, label: 'Resume Analyzer' },
  { to: '/ai-interview', icon: MessageSquare, label: 'AI Interview' },
  { to: '/coding', icon: Code, labelKey: 'assessment' as const },
  { to: '/skill-gap', icon: Target, label: 'Skill Gap' },
  { to: '/roadmap', icon: Map, label: 'Roadmap' },
  { to: '/linkedin', icon: Share2, label: 'LinkedIn Analyzer' },
  { to: '/applications', icon: Briefcase, label: 'Applications' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const counselorNavItems = [
  { to: '/placement-cell', icon: GraduationCap, label: 'Placement Cell' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const isCounselor = user?.role === 'admin' || user?.role === 'counselor';
  const studentNavItems = baseStudentNavItems.map((item) =>
    'labelKey' in item && item.labelKey === 'assessment'
      ? { ...item, label: getAssessmentNavLabel(profile?.academicStream) }
      : item
  );
  const navItems = isCounselor
    ? [...counselorNavItems, ...studentNavItems]
    : studentNavItems;

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 80 : 280 }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-background-secondary/80 backdrop-blur-xl"
    >
      <div className="flex h-[72px] items-center justify-between border-b border-border px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">CareerOS</p>
              <p className="text-xs text-text-muted">Placement Copilot</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'border-l-2 border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </motion.aside>
  );
}
