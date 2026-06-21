import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { resumeApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { CircularProgress } from '@/components/ui/motion';

export default function ResumeAnalyzerPage() {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: resume, refetch, isLoading } = useQuery({
    queryKey: ['resume-report'],
    queryFn: async () => {
      try {
        const res = await resumeApi.getReport();
        return res.data.data;
      } catch {
        return null;
      }
    },
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await resumeApi.upload(file);
      toast.success('Resume uploaded!');
      refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await resumeApi.analyze();
      toast.success('Analysis complete!');
      refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setAnalyzing(false);
    }
  };

  if (isLoading) return <PageSkeleton />;

  const analysis = resume?.analysis;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resume Analyzer</h1>
        <p className="text-text-muted">ATS analysis powered by AI</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border p-12 text-center">
            <Upload className="mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Upload Your Resume</h3>
            <p className="mb-4 text-sm text-text-muted">PDF or DOCX, max 10MB</p>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              className="hidden"
              id="resume-upload"
            />
            <label htmlFor="resume-upload">
              <Button asChild loading={uploading}>
                <span>Choose File</span>
              </Button>
            </label>
            {resume && (
              <p className="mt-4 flex items-center gap-2 text-sm text-success">
                <FileText className="h-4 w-4" /> {resume.fileName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {resume && (
        <div className="flex justify-center">
          <Button onClick={handleAnalyze} loading={analyzing} size="lg">
            Analyze Resume with AI
          </Button>
        </div>
      )}

      {analysis && analysis.atsScore > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="flex flex-col items-center">
            <CardHeader><CardTitle>ATS Score</CardTitle></CardHeader>
            <CardContent>
              <CircularProgress value={analysis.atsScore} size={140} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent>
              <p className="text-text-secondary">{analysis.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {analysis.extractedSkills.map((s) => <Badge key={s}>{s}</Badge>)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-warning" />Missing Keywords</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.missingKeywords.map((k) => <Badge key={k} variant="warning">{k}</Badge>)}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-success" />Suggestions</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />{s}
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
