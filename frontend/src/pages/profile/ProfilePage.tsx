import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  User, Upload, Pencil, X, Check, FileText, ExternalLink, Eye, Loader2,
} from 'lucide-react';
import { profileApi, resumeApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store';
import {
  ACADEMIC_STREAMS,
  getDefaultTargetRole,
  getStreamLabel,
  isTechStream,
} from '@/lib/academicStreams';

export default function ProfilePage() {
  const setProfile = useAuthStore((s) => s.setProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [skillsInput, setSkillsInput] = useState('');

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await profileApi.get();
      const p = res.data.data;
      setProfile(p);
      const allSkills = [
        ...p.skills.languages,
        ...p.skills.frameworks,
        ...p.skills.databases,
        ...p.skills.tools,
        ...p.skills.certifications,
      ];
      setSkillsInput(allSkills.join(', '));
      return p;
    },
  });

  const { data: resumeData } = useQuery({
    queryKey: ['resume-info'],
    queryFn: async () => {
      const res = await resumeApi.getAll();
      const resumes = res.data.data;
      return resumes.find((r) => r.isActive) ?? resumes[0] ?? null;
    },
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => profileApi.update(data),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      refetch();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleSave = () => {
    if (!profile) return;
    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateMutation.mutate({
      academicStream: form.academicStream ?? profile.academicStream,
      phone: form.phone ?? profile.phone ?? '',
      location: form.location ?? profile.location ?? '',
      education: {
        collegeName: form.collegeName ?? profile.education.collegeName,
        degree: form.degree ?? profile.education.degree,
        branch: form.branch ?? profile.education.branch,
        currentYear: profile.education.currentYear,
        graduationYear: profile.education.graduationYear,
        cgpa: form.cgpa ? parseFloat(form.cgpa) : profile.education.cgpa,
      },
      careerPreferences: {
        targetRole: form.targetRole ?? profile.careerPreferences?.targetRole ?? getDefaultTargetRole(profile.academicStream),
        preferredLocations: profile.careerPreferences?.preferredLocations ?? [],
        jobType: profile.careerPreferences?.jobType ?? 'full-time',
        workMode: profile.careerPreferences?.workMode ?? 'hybrid',
        // Never send expectedSalary unless it has real values — avoids validation errors
        ...(profile.careerPreferences?.expectedSalary?.min != null
          ? { expectedSalary: profile.careerPreferences.expectedSalary }
          : {}),
      },
      skills: {
        languages: skills,
        frameworks: [],
        databases: [],
        tools: [],
        certifications: [],
      },
      linkedinUrl: form.linkedinUrl ?? profile.linkedinUrl ?? '',
      githubUrl: form.githubUrl ?? profile.githubUrl ?? '',
      portfolioUrl: form.portfolioUrl ?? profile.portfolioUrl ?? '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setForm({});
    if (profile) {
      const allSkills = [
        ...profile.skills.languages,
        ...profile.skills.frameworks,
        ...profile.skills.databases,
        ...profile.skills.tools,
        ...profile.skills.certifications,
      ];
      setSkillsInput(allSkills.join(', '));
    }
  };

  const [extractingSkills, setExtractingSkills] = useState(false);

  const handleResumeUpload = async (file: File) => {
    try {
      await resumeApi.upload(file);
      toast.success('Resume uploaded! Extracting skills...');
      setExtractingSkills(true);

      try {
        const analysisRes = await resumeApi.analyze();
        const extracted: string[] = analysisRes.data.data.analysis.extractedSkills ?? [];

        if (extracted.length > 0) {
          setSkillsInput((prev) => {
            const existing = prev.split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.toLowerCase());
            const newOnes = extracted.filter((s) => !existing.includes(s.toLowerCase()));
            const merged = [...prev.split(',').map((s) => s.trim()).filter(Boolean), ...newOnes];
            return merged.join(', ');
          });
          toast.success(`${extracted.length} skills extracted from your resume!`);
          if (!isEditing) setIsEditing(true);
        } else {
          toast.info('Resume analyzed. No new skills found to add.');
        }
      } catch {
        toast.info('Resume uploaded. Go to Resume Analyzer for skill extraction.');
      } finally {
        setExtractingSkills(false);
      }

      refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  if (isLoading || !profile) return <PageSkeleton />;

  const techStream = isTechStream(profile.academicStream);
  const allSkills = [
    ...profile.skills.languages,
    ...profile.skills.frameworks,
    ...profile.skills.databases,
    ...profile.skills.tools,
    ...profile.skills.certifications,
  ];

  const field = (key: string, label: string, defaultVal: string, type = 'text') => (
    <div>
      <label className="mb-1 block text-sm font-medium text-text-secondary">{label}</label>
      {isEditing ? (
        <Input
          type={type}
          defaultValue={defaultVal}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      ) : (
        <p className="min-h-[44px] rounded-[14px] border border-transparent bg-surface-hover/40 px-4 py-2.5 text-sm text-text-primary">
          {defaultVal || <span className="text-text-muted italic">Not set</span>}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-text-muted">
            {getStreamLabel(profile.academicStream)} · {profile.education.degree || 'Student'}
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleSave} loading={updateMutation.isPending}>
                <Check className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {field('phone', 'Phone Number', profile.phone ?? '')}
            {field('location', 'City / Location', profile.location ?? '')}
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <CardTitle>Education & Stream</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">Field of Study</label>
                <select
                  className="h-12 w-full rounded-[14px] border border-border bg-surface px-4 text-sm"
                  defaultValue={profile.academicStream ?? 'other'}
                  onChange={(e) => setForm((f) => ({ ...f, academicStream: e.target.value }))}
                >
                  {ACADEMIC_STREAMS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">Field of Study</label>
                <p className="rounded-[14px] bg-surface-hover/40 px-4 py-2.5 text-sm text-text-primary">
                  {getStreamLabel(profile.academicStream)}
                </p>
              </div>
            )}
            {field('collegeName', 'College / University', profile.education.collegeName)}
            {field('degree', 'Degree', profile.education.degree)}
            {field('branch', 'Branch / Specialization', profile.education.branch)}
            {field('cgpa', 'CGPA / Percentage', String(profile.education.cgpa ?? ''), 'number')}
          </CardContent>
        </Card>

        {/* Skills — flat, no subcategory headers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Skills
              {extractingSkills && (
                <span className="flex items-center gap-1 text-sm font-normal text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Extracting from resume...
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  All Skills <span className="text-text-muted font-normal">(comma separated)</span>
                </label>
                <textarea
                  className="mt-1 min-h-[100px] w-full rounded-[14px] border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Python, React, SQL, Excel, Communication..."
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                />
                <p className="mt-1 text-xs text-text-muted">Add all your skills separated by commas</p>
              </div>
            ) : allSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allSkills.map((skill) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-text-muted">No skills added yet. Click Edit Profile to add.</p>
            )}
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {field('linkedinUrl', 'LinkedIn URL', profile.linkedinUrl ?? '')}
            {field('targetRole', 'Target Role', profile.careerPreferences?.targetRole || getDefaultTargetRole(profile.academicStream))}
            {techStream && field('githubUrl', 'GitHub URL', profile.githubUrl ?? '')}
            {field('portfolioUrl', techStream ? 'Portfolio URL' : 'Portfolio / Work Samples', profile.portfolioUrl ?? '')}
          </CardContent>
        </Card>

        {/* Resume — full width, with file name + view + upload */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resumeData ? (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-border bg-surface-hover/40 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{resumeData.fileName}</p>
                    <p className="text-xs text-text-muted">
                      Uploaded {new Date(resumeData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {resumeData.analysis?.atsScore > 0 && (
                        <span className="ml-2 text-success">· ATS Score: {resumeData.analysis.atsScore}%</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(resumeData.fileUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <Eye className="mr-2 h-4 w-4" /> View Resume
                  </Button>
                  <a href={resumeData.fileUrl} target="_blank" rel="noopener noreferrer" download={resumeData.fileName}>
                    <Button variant="secondary" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" /> Open
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <p className="mb-4 rounded-[14px] border border-dashed border-border px-5 py-4 text-sm italic text-text-muted">
                No resume uploaded yet.
              </p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <input
                type="file"
                accept=".pdf,.docx"
                id="profile-resume"
                className="hidden"
                disabled={extractingSkills}
                onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])}
              />
              <label htmlFor="profile-resume">
                <Button variant={resumeData ? 'secondary' : 'default'} asChild disabled={extractingSkills}>
                  <span>
                    {extractingSkills
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                      : <><Upload className="mr-2 h-4 w-4" />{resumeData ? 'Upload New Resume' : 'Upload Resume'}</>
                    }
                  </span>
                </Button>
              </label>
              <p className="text-xs text-text-muted">PDF or DOCX · Max 10 MB · Skills auto-extracted</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
