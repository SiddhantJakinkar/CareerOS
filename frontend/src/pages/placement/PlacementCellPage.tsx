import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, TrendingUp, Briefcase, AlertTriangle, GraduationCap } from 'lucide-react';
import { placementApi } from '@/services/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '@/components/ui/motion';
import { formatDate } from '@/lib/utils';

const COLORS = ['#4F7CFF', '#8B5CF6', '#22C55E', '#F59E0B'];

interface TopPerformer {
  userId: string;
  name: string;
  email: string;
  college: string;
  branch: string;
  readiness: number;
}

interface AtRiskStudent {
  userId: string;
  name: string;
  readiness: number;
  weakAreas: string[];
}

interface RecentPlacement {
  studentName: string;
  company: string;
  role: string;
  date: string;
}

export default function PlacementCellPage() {
  const [college, setCollege] = useState('');

  const { data: colleges } = useQuery({
    queryKey: ['placement-colleges'],
    queryFn: async () => (await placementApi.getColleges()).data.data as string[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['placement-overview', college],
    queryFn: async () =>
      (await placementApi.getOverview(college || undefined)).data.data,
  });

  if (isLoading) return <PageSkeleton />;

  const overview = data;

  const statCards = [
    { label: 'Total Students', value: overview?.totalStudents ?? 0, icon: Users, color: 'text-primary' },
    { label: 'Avg Readiness', value: overview?.averageReadiness ?? 0, icon: TrendingUp, color: 'text-success', suffix: '%' },
    { label: 'Placement Rate', value: overview?.placementRate ?? 0, icon: GraduationCap, color: 'text-secondary', suffix: '%' },
    { label: 'At Risk', value: overview?.atRiskStudents?.length ?? 0, icon: AlertTriangle, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Placement Cell Dashboard</h1>
          <p className="text-text-muted">Institution-wide placement analytics</p>
        </div>
        <select
          className="h-12 rounded-xl border border-border bg-surface px-4 text-sm"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
        >
          <option value="">All Colleges</option>
          {colleges?.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <motion.div key={stat.label} whileHover={{ scale: 1.02, y: -2 }}>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`rounded-xl bg-surface-hover p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                  <p className="text-2xl font-bold">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix ?? ''} />
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Readiness Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={overview?.readinessDistribution ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252833" />
                <XAxis dataKey="range" stroke="#7d8394" fontSize={12} />
                <YAxis stroke="#7d8394" fontSize={12} />
                <Tooltip contentStyle={{ background: '#16181d', border: '1px solid #252833' }} />
                <Bar dataKey="count" fill="#4f7cff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Application Funnel</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Applied', value: overview?.applications.applied ?? 0 },
                    { name: 'Interviews', value: overview?.applications.interviews ?? 0 },
                    { name: 'Selected', value: overview?.applications.selected ?? 0 },
                    { name: 'Rejected', value: overview?.applications.rejected ?? 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {COLORS.map((color, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#16181d', border: '1px solid #252833' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Avg ATS</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{overview?.averageAts ?? 0}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Avg Coding</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-secondary">{overview?.averageCoding ?? 0}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Avg Interview</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-success">{overview?.averageInterview ?? 0}%</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Performers</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {overview?.topPerformers?.map((s: TopPerformer, i: number) => (
              <div key={s.userId} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-text-muted">{s.branch} · {s.college}</p>
                  </div>
                </div>
                <Badge variant="success">{s.readiness}%</Badge>
              </div>
            )) ?? <p className="text-text-muted">No students yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> At-Risk Students
          </CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {overview?.atRiskStudents?.map((s: AtRiskStudent) => (
              <div key={s.userId} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{s.name}</p>
                  <Badge variant="warning">{s.readiness}%</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.weakAreas.map((w: string) => (
                    <Badge key={w} variant="secondary">{w}</Badge>
                  ))}
                </div>
              </div>
            )) ?? <p className="text-text-muted">No at-risk students</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" /> Recent Placements
        </CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 pr-4">Company</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {overview?.recentPlacements?.map((p: RecentPlacement, i: number) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium">{p.studentName}</td>
                    <td className="py-3 pr-4">{p.company}</td>
                    <td className="py-3 pr-4">{p.role}</td>
                    <td className="py-3 text-text-muted">{formatDate(p.date)}</td>
                  </tr>
                )) ?? (
                  <tr><td colSpan={4} className="py-4 text-text-muted">No placements recorded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {overview?.branchBreakdown && overview.branchBreakdown.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Branch Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={overview.branchBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252833" />
                <XAxis dataKey="branch" stroke="#7d8394" fontSize={11} />
                <YAxis stroke="#7d8394" fontSize={12} />
                <Tooltip contentStyle={{ background: '#16181d', border: '1px solid #252833' }} />
                <Bar dataKey="avgReadiness" fill="#8b5cf6" name="Avg Readiness" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
