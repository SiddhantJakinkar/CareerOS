import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Building2, DollarSign, ExternalLink, Globe, Loader2 } from 'lucide-react';
import { jobApi } from '@/services/endpoints';
import { useAuthStore } from '@/store';
import { INDIA_CITIES, getDefaultIndiaLocation } from '@/lib/indiaJobs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import type { Job } from '@/types';

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (job.applyUrl) window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
  };

  const boardLabel = job.publisher || 'India';

  return (
    <motion.div whileHover={{ scale: 1.02, y: -4 }} transition={{ duration: 0.3 }}>
      <Card className="cursor-pointer" onClick={onClick}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-text-primary">{job.title}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-text-muted">
                <Building2 className="h-3 w-3" /> {job.company}
              </p>
            </div>
            {job.matchScore && (
              <Badge variant="success">{job.matchScore.totalScore}%</Badge>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-muted">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
            {job.salary && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{job.salary}</span>}
            <Badge variant="secondary">{formatJobType(job.jobType)}</Badge>
            <Badge variant="secondary">{job.workMode}</Badge>
            <Badge variant="secondary">
              <Globe className="mr-1 h-3 w-3" />
              {boardLabel}
            </Badge>
          </div>
          {job.applyUrl && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 w-full"
              onClick={handleApply}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Apply on {boardLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

const JOB_TYPE_OPTIONS = [
  { value: '', label: 'All Job Types' },
  { value: 'internship', label: 'Internship' },
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
] as const;

function formatJobType(jobType: string): string {
  const normalized = jobType.toLowerCase();
  if (normalized.includes('intern')) return 'Internship';
  if (normalized.includes('part')) return 'Part Time';
  if (normalized.includes('contract')) return 'Contract';
  if (normalized.includes('full')) return 'Full Time';
  return jobType;
}

export default function JobSearchPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const defaultLocation = getDefaultIndiaLocation(profile);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const [location, setLocation] = useState(
    INDIA_CITIES.includes(defaultLocation as (typeof INDIA_CITIES)[number]) ? defaultLocation : 'India (All)'
  );
  const [jobType, setJobType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [filters, setFilters] = useState({
    search: initialSearch,
    location: 'India',
    jobType: '',
    workMode: '',
  });

  useEffect(() => {
    const nextLocation = getDefaultIndiaLocation(profile);
    const displayLocation = INDIA_CITIES.includes(nextLocation as (typeof INDIA_CITIES)[number])
      ? nextLocation
      : 'India (All)';
    setLocation(displayLocation);
    setSearch(searchParams.get('search') ?? '');
    setFilters((prev) => ({
      ...prev,
      search: searchParams.get('search') ?? '',
      location: displayLocation === 'India (All)' ? 'India' : displayLocation,
    }));
  }, [searchParams, profile]);

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs', filters.search, filters.location, filters.jobType, filters.workMode],
    queryFn: async () => {
      const res = await jobApi.search({
        search: filters.search,
        location: filters.location || 'India',
        jobType: filters.jobType,
        workMode: filters.workMode,
        live: false,
        limit: 30,
      });
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: recommended } = useQuery({
    queryKey: ['jobs-recommended'],
    queryFn: async () => (await jobApi.recommended()).data.data,
  });

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const apiLocation = location === 'India (All)' ? 'India' : location;
    setFilters({ search, location: apiLocation, jobType, workMode });
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (jobType) params.jobType = jobType;
    setSearchParams(params);
  };

  const jobs = jobsData?.jobs ?? [];
  const total = jobsData?.total ?? 0;
  const showInitialSkeleton = isLoading && jobs.length === 0;

  if (showInitialSkeleton) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading...</span>
        </div>
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Job Search</h1>
        <p className="text-text-muted">
          India placements — onsite, hybrid, and remote jobs from LinkedIn, Naukri, Indeed, Internshala, and more
        </p>
        {jobs.length > 0 && (
          <p className="mt-2 flex items-center gap-2 text-sm text-success">
            <Globe className="h-4 w-4" />
            Showing {jobs.length} of {total} matching jobs
          </p>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4" onSubmit={handleSearch}>
            <Input
              placeholder="Search roles, companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <select
              className="h-12 rounded-[14px] border border-border bg-surface px-4 text-sm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              {INDIA_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <select
              className="h-12 rounded-[14px] border border-border bg-surface px-4 text-sm"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            >
              {JOB_TYPE_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="h-12 rounded-[14px] border border-border bg-surface px-4 text-sm"
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
            >
              <option value="">All Work Modes</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
            <Button type="submit">Filter Jobs</Button>
          </form>
        </CardContent>
      </Card>

      {recommended && recommended.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Recommended For You (India)</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommended.slice(0, 6).map((job) => (
              <JobCard key={job._id} job={job} onClick={() => navigate(`/jobs/${job._id}`)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold">Jobs in India</h2>
        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} onClick={() => navigate(`/jobs/${job._id}`)} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No jobs match your filters yet"
            description="Jobs sync every 30 minutes from Indian job boards. Try a different city or role, or check back after the next sync."
          />
        )}
      </section>
    </div>
  );
}
