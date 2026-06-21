import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Share2 } from 'lucide-react';
import { linkedinApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { CircularProgress } from '@/components/ui/motion';

export default function LinkedInAnalyzerPage() {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [profileContent, setProfileContent] = useState('');
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);

  const mutation = useMutation({
    mutationFn: () => linkedinApi.analyze({ linkedinUrl, profileContent }),
    onSuccess: (res) => {
      setAnalysis(res.data.data);
      toast.success('Analysis complete!');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const sections = ['headline', 'about', 'skills', 'experience', 'projects'] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">LinkedIn Analyzer</h1>
        <p className="text-text-muted">Optimize your LinkedIn profile with AI insights</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Input label="LinkedIn Profile URL" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
          <div>
            <label className="text-sm font-medium text-text-secondary">Profile Content</label>
            <p className="mb-2 text-xs text-text-muted">Paste your headline, about, experience, skills, and projects</p>
            <textarea
              className="min-h-[200px] w-full rounded-xl border border-border bg-surface p-4 text-sm focus:border-primary focus:outline-none"
              value={profileContent}
              onChange={(e) => setProfileContent(e.target.value)}
              placeholder="Paste your LinkedIn profile content here..."
            />
          </div>
          <Button
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
            disabled={!profileContent || profileContent.trim().length < 50 || !linkedinUrl}
          >
            <Share2 className="mr-2 h-4 w-4" /> Analyze Profile
          </Button>
          {profileContent.trim().length > 0 && profileContent.trim().length < 50 && (
            <p className="text-xs text-warning">Paste at least 50 characters of profile content.</p>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="flex flex-col items-center">
            <CardHeader><CardTitle>Profile Score</CardTitle></CardHeader>
            <CardContent>
              <CircularProgress value={(analysis as { profileScore: number }).profileScore} size={140} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sections.map((section) => {
              const data = (analysis as Record<string, { score: number; suggestions: string[] }>)[section];
              if (!data) return null;
              return (
                <Card key={section}>
                  <CardHeader>
                    <CardTitle className="capitalize">{section}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 flex items-center gap-3">
                      <Progress value={data.score} className="flex-1 h-2" />
                      <span className="text-sm font-bold">{data.score}%</span>
                    </div>
                    <ul className="space-y-1 text-sm text-text-secondary">
                      {data.suggestions.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
