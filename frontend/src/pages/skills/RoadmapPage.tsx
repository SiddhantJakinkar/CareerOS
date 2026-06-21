import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Map, CheckCircle2, Circle } from 'lucide-react';
import { skillsApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store';
import { getDefaultTargetRole } from '@/lib/academicStreams';

export default function RoadmapPage() {
  const profile = useAuthStore((s) => s.profile);
  const [targetRole, setTargetRole] = useState('');

  useEffect(() => {
    if (profile) {
      setTargetRole(profile.careerPreferences.targetRole || getDefaultTargetRole(profile.academicStream));
    }
  }, [profile]);

  const { data: roadmaps, refetch } = useQuery({
    queryKey: ['roadmaps'],
    queryFn: async () => (await skillsApi.getRoadmaps()).data.data,
  });

  const generateMutation = useMutation({
    mutationFn: () => skillsApi.generateRoadmap(targetRole),
    onSuccess: () => {
      toast.success('Roadmap generated!');
      refetch();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, weekIndex, completed }: { id: string; weekIndex: number; completed: boolean }) =>
      skillsApi.updateRoadmap(id, weekIndex, completed),
    onSuccess: () => refetch(),
  });

  const activeRoadmap = roadmaps?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Roadmap</h1>
        <p className="text-text-muted">Personalized learning paths for your career goals</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <Input label="Target Role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="flex-1 min-w-[200px]" />
          <Button loading={generateMutation.isPending} onClick={() => generateMutation.mutate()}>
            <Map className="mr-2 h-4 w-4" /> Generate Roadmap
          </Button>
        </CardContent>
      </Card>

      {activeRoadmap && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{activeRoadmap.targetRole} Roadmap</CardTitle>
                <Badge>{activeRoadmap.progress}% Complete</Badge>
              </div>
              <Progress value={activeRoadmap.progress} className="mt-2 h-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {activeRoadmap.weeks.map((week: { week: number; title: string; topics: string[]; resources: string[]; completed: boolean }, idx: number) => (
                <div
                  key={week.week}
                  className={`rounded-xl border p-4 transition-colors ${week.completed ? 'border-success/30 bg-success/5' : 'border-border'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateMutation.mutate({ id: activeRoadmap._id, weekIndex: idx, completed: !week.completed })}>
                        {week.completed ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-text-muted" />}
                      </button>
                      <div>
                        <p className="font-medium">Week {week.week}: {week.title}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {week.topics.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {week.resources.length > 0 && (
                    <p className="mt-2 text-xs text-text-muted">Resources: {week.resources.join(', ')}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
