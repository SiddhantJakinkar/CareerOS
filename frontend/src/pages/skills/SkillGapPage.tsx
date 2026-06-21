import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Target, AlertTriangle } from 'lucide-react';
import { skillsApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { CircularProgress } from '@/components/ui/motion';
import { useAuthStore } from '@/store';
import { getDefaultTargetRole } from '@/lib/academicStreams';

export default function SkillGapPage() {
  const profile = useAuthStore((s) => s.profile);
  const [targetRole, setTargetRole] = useState('');

  useEffect(() => {
    if (profile) {
      setTargetRole(profile.careerPreferences.targetRole || getDefaultTargetRole(profile.academicStream));
    }
  }, [profile]);
  const [analysis, setAnalysis] = useState<{
    currentSkills: string[];
    requiredSkills: string[];
    missingSkills: string[];
    matchPercentage: number;
    recommendations: string[];
  } | null>(null);

  const mutation = useMutation({
    mutationFn: () => skillsApi.getGap(targetRole),
    onSuccess: (res) => {
      setAnalysis(res.data.data);
      toast.success('Analysis complete!');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Skill Gap Analysis</h1>
        <p className="text-text-muted">Identify missing skills for your target role</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <Input label="Target Role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="flex-1 min-w-[200px]" />
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            <Target className="mr-2 h-4 w-4" /> Analyze
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="flex flex-col items-center">
            <CardHeader><CardTitle>Match Score</CardTitle></CardHeader>
            <CardContent>
              <CircularProgress value={analysis.matchPercentage} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Current Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.currentSkills.map((s) => <Badge key={s} variant="success">{s}</Badge>)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Missing Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills.map((s) => <Badge key={s} variant="warning">{s}</Badge>)}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.recommendations.map((r, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Progress value={100 - i * 15} className="h-2 w-24" />
                    <span className="text-sm text-text-secondary">{r}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
