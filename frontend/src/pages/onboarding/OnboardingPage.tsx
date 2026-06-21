import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { profileApi, resumeApi } from '@/services/endpoints';
import { useAuthStore } from '@/store';
import { getErrorMessage } from '@/services/api';
import {
  ACADEMIC_STREAMS,
  getDefaultTargetRole,
  getSkillFieldLabels,
  isTechStream,
  type AcademicStreamId,
} from '@/lib/academicStreams';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = ['Personal', 'Education & Stream', 'Career', 'Skills', 'Resume'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: '',
    location: '',
    academicStream: 'other' as AcademicStreamId,
    education: { collegeName: '', degree: '', branch: '', currentYear: 4, graduationYear: new Date().getFullYear(), cgpa: 0 },
    careerPreferences: { targetRole: '', preferredLocations: [] as string[], jobType: 'full-time', workMode: 'hybrid' },
    skills: { languages: [] as string[], frameworks: [] as string[], databases: [] as string[], tools: [] as string[] },
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  });
  const [locationsInput, setLocationsInput] = useState('');
  const [skillsInput, setSkillsInput] = useState({ languages: '', frameworks: '', databases: '', tools: '' });

  const skillLabels = getSkillFieldLabels(form.academicStream);
  const techStream = isTechStream(form.academicStream);

  const update = (path: string, value: unknown) => {
    setForm((prev) => {
      const keys = path.split('.');
      const next = { ...prev };
      let obj: Record<string, unknown> = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]] as Record<string, unknown>;
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const selectStream = (streamId: AcademicStreamId) => {
    setForm((prev) => ({
      ...prev,
      academicStream: streamId,
      careerPreferences: {
        ...prev.careerPreferences,
        targetRole: prev.careerPreferences.targetRole || getDefaultTargetRole(streamId),
      },
    }));
  };

  const handleResumeUpload = async (file: File) => {
    try {
      await resumeApi.upload(file);
      toast.success('Resume uploaded');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        careerPreferences: {
          ...form.careerPreferences,
          targetRole: form.careerPreferences.targetRole || getDefaultTargetRole(form.academicStream),
          preferredLocations: locationsInput.split(',').map((l) => l.trim()).filter(Boolean),
        },
        skills: {
          languages: skillsInput.languages.split(',').map((s) => s.trim()).filter(Boolean),
          frameworks: skillsInput.frameworks.split(',').map((s) => s.trim()).filter(Boolean),
          databases: skillsInput.databases.split(',').map((s) => s.trim()).filter(Boolean),
          tools: skillsInput.tools.split(',').map((s) => s.trim()).filter(Boolean),
          certifications: [],
        },
      };
      await profileApi.completeOnboarding(payload);
      if (user) setUser({ ...user, onboardingCompleted: true });
      toast.success('Profile setup complete!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Complete Your Profile</h1>
        <p className="text-text-muted">CareerOS works for every stream — engineering, commerce, arts, science, law, and more.</p>
        <p className="mt-1 text-sm text-text-muted">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        <div className="mt-4 flex gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-surface-hover'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <Card>
            <CardHeader><CardTitle>{STEPS[step]} Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {step === 0 && (
                <>
                  <Input label="Full Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
                  <Input label="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                  <Input label="Location" value={form.location} onChange={(e) => update('location', e.target.value)} />
                </>
              )}
              {step === 1 && (
                <>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Your field of study</label>
                    <p className="mb-3 text-xs text-text-muted">This personalizes interviews, assessments, and career guidance for your stream.</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {ACADEMIC_STREAMS.map((stream) => (
                        <button
                          key={stream.id}
                          type="button"
                          onClick={() => selectStream(stream.id)}
                          className={cn(
                            'rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                            form.academicStream === stream.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/40 hover:bg-surface-hover'
                          )}
                        >
                          <span className="font-medium">{stream.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input label="College / University" value={form.education.collegeName} onChange={(e) => update('education.collegeName', e.target.value)} />
                  <Input label="Degree / Program" value={form.education.degree} onChange={(e) => update('education.degree', e.target.value)} />
                  <Input label="Branch / Specialization" value={form.education.branch} onChange={(e) => update('education.branch', e.target.value)} placeholder="e.g. B.Com, BA English, B.Sc Physics, CSE" />
                  <Input label="CGPA" type="number" step="0.01" value={form.education.cgpa} onChange={(e) => update('education.cgpa', parseFloat(e.target.value))} />
                  <Input label="Graduation Year" type="number" value={form.education.graduationYear} onChange={(e) => update('education.graduationYear', parseInt(e.target.value))} />
                </>
              )}
              {step === 2 && (
                <>
                  <Input
                    label="Target Role"
                    value={form.careerPreferences.targetRole}
                    onChange={(e) => update('careerPreferences.targetRole', e.target.value)}
                    placeholder={getDefaultTargetRole(form.academicStream)}
                  />
                  <Input label="Preferred Locations (comma separated)" value={locationsInput} onChange={(e) => setLocationsInput(e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary">Job Type</label>
                      <select className="mt-2 h-12 w-full rounded-[14px] border border-border bg-surface px-4" value={form.careerPreferences.jobType} onChange={(e) => update('careerPreferences.jobType', e.target.value)}>
                        <option value="full-time">Full Time</option>
                        <option value="internship">Internship</option>
                        <option value="part-time">Part Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary">Work Mode</label>
                      <select className="mt-2 h-12 w-full rounded-[14px] border border-border bg-surface px-4" value={form.careerPreferences.workMode} onChange={(e) => update('careerPreferences.workMode', e.target.value)}>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="onsite">Onsite</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <Input label={`${skillLabels.languages} (comma separated)`} value={skillsInput.languages} onChange={(e) => setSkillsInput((s) => ({ ...s, languages: e.target.value }))} />
                  <Input label={skillLabels.frameworks} value={skillsInput.frameworks} onChange={(e) => setSkillsInput((s) => ({ ...s, frameworks: e.target.value }))} />
                  <Input label={skillLabels.databases} value={skillsInput.databases} onChange={(e) => setSkillsInput((s) => ({ ...s, databases: e.target.value }))} />
                  <Input label={skillLabels.tools} value={skillsInput.tools} onChange={(e) => setSkillsInput((s) => ({ ...s, tools: e.target.value }))} />
                </>
              )}
              {step === 4 && (
                <>
                  <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
                    <Upload className="mx-auto mb-4 h-10 w-10 text-text-muted" />
                    <p className="mb-4 text-text-muted">Upload your resume (PDF)</p>
                    <input type="file" accept=".pdf,.docx" onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])} className="text-sm" />
                  </div>
                  <Input label="LinkedIn URL" value={form.linkedinUrl} onChange={(e) => update('linkedinUrl', e.target.value)} />
                  {techStream ? (
                    <Input label="GitHub URL (optional)" value={form.githubUrl} onChange={(e) => update('githubUrl', e.target.value)} />
                  ) : (
                    <Input label="Portfolio / Work Samples URL (optional)" value={form.portfolioUrl} onChange={(e) => update('portfolioUrl', e.target.value)} />
                  )}
                </>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
                {step < STEPS.length - 1 ? (
                  <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
                ) : (
                  <Button onClick={handleComplete} loading={loading}>Complete Setup</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
