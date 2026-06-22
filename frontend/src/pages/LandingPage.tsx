import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  FileText,
  Briefcase,
  Video,
  Bot,
  Target,
  Code2,
  Share2,
  BarChart3,
  GraduationCap,
  Mic,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const features = [
  {
    icon: FileText,
    title: 'Resume & ATS Analyzer',
    description: 'Upload your resume, get ATS scores, missing keywords, and AI-powered improvements tailored for Indian recruiters.',
  },
  {
    icon: Briefcase,
    title: 'Smart Job Discovery',
    description: 'Browse internships and jobs across India with AI match scores based on your skills, stream, and preferences.',
  },
  {
    icon: Video,
    title: 'Live AI Mock Interview',
    description: 'Real-time video interviews with camera and mic — dynamic questions, spoken feedback, and job-specific practice.',
  },
  {
    icon: Bot,
    title: 'Career Copilot',
    description: 'Ask anything about placements, interviews, resumes, and career decisions with your personal AI mentor.',
  },
  {
    icon: Target,
    title: 'Skill Gap & Roadmaps',
    description: 'See what skills you are missing for your target role and get a step-by-step learning roadmap.',
  },
  {
    icon: Code2,
    title: 'Coding Assessments',
    description: 'Practice aptitude and coding tests with instant evaluation to boost your placement readiness score.',
  },
  {
    icon: Share2,
    title: 'LinkedIn Optimizer',
    description: 'Analyze your LinkedIn profile section by section with actionable suggestions to stand out.',
  },
  {
    icon: BarChart3,
    title: 'Application Tracker',
    description: 'Track saved, applied, and interview-stage applications in one place with cover letter generation.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Build your profile',
    description: 'Complete onboarding with your academic stream, skills, and target role so CareerOS personalizes everything.',
  },
  {
    step: '02',
    title: 'Prepare with AI',
    description: 'Analyze your resume, practice live interviews, and close skill gaps before you apply.',
  },
  {
    step: '03',
    title: 'Land your role',
    description: 'Apply to matched jobs, track applications, and use insights to ace real interviews.',
  },
];

const highlights = [
  'India-focused job feeds & placement workflows',
  'Live mock interviews like real screening rounds',
  'Job-specific interview practice from any listing',
  'Placement Cell dashboard for counselors',
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={user?.onboardingCompleted ? '/dashboard' : '/onboarding'} replace />;
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -right-32 top-40 h-[24rem] w-[24rem] rounded-full bg-secondary/15 blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">CareerOS</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-text-secondary md:flex">
            <a href="#features" className="transition-colors hover:text-text-primary">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-text-primary">
              How it works
            </a>
            <a href="#interview" className="transition-colors hover:text-text-primary">
              AI Interview
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">
                Get started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="mb-5">
                AI Placement Copilot for Indian Students
              </Badge>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Your career operating system for{' '}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  placements
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary">
                CareerOS combines resume intelligence, job matching, live AI interviews, skill
                roadmaps, and application tracking — built for students and freshers targeting
                internships and first jobs in India.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/register">
                    Start free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/login">I already have an account</Link>
                </Button>
              </div>
              <ul className="mt-8 grid gap-2 sm:grid-cols-2">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="glass-card overflow-hidden p-1"
            >
              <div className="rounded-[18px] bg-surface p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Placement readiness
                    </p>
                    <p className="mt-1 text-2xl font-bold text-primary">78%</p>
                  </div>
                  <Badge variant="success">On track</Badge>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'ATS Resume Score', value: 82 },
                    { label: 'Interview Practice', value: 74 },
                    { label: 'Job Match', value: 86 },
                    { label: 'Coding Readiness', value: 69 },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-text-secondary">{stat.label}</span>
                        <span className="font-medium">{stat.value}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${stat.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Bot className="h-4 w-4" />
                    Career Copilot
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">
                    &ldquo;Your React fundamentals are strong. Practice 2 system design questions
                    before your TCS interview next week.&rdquo;
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="border-y border-border/60 bg-background-secondary/50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              {...fadeUp}
              viewport={{ once: true }}
              whileInView="animate"
              initial="initial"
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="text-3xl font-bold sm:text-4xl">Everything you need to get placed</h2>
              <p className="mt-4 text-text-secondary">
                One platform from resume to offer letter — powered by Gemini AI and built for the
                Indian placement journey.
              </p>
            </motion.div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card group p-5 transition-transform hover:-translate-y-1"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="interview" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="glass-card grid overflow-hidden lg:grid-cols-2">
              <div className="border-b border-border p-8 sm:p-10 lg:border-b-0 lg:border-r">
                <Badge className="mb-4">Flagship feature</Badge>
                <h2 className="text-3xl font-bold">Practice like it&apos;s the real interview</h2>
                <p className="mt-4 text-text-secondary">
                  Our live AI mock interview uses your camera and microphone — the AI speaks
                  questions aloud, listens to your answers, gives feedback, and moves on automatically.
                  Practice for a specific job directly from the job listing.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-text-secondary">
                  <li className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-primary" /> Live video + speech recognition
                  </li>
                  <li className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-primary" /> Text, voice, and video interview modes
                  </li>
                  <li className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" /> Job-specific question generation
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Overall review with focus areas
                  </li>
                </ul>
              </div>
              <div className="flex flex-col justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-8 sm:p-10">
                <p className="text-sm font-medium uppercase tracking-wider text-text-muted">
                  Sample interviewer
                </p>
                <p className="mt-4 text-lg leading-relaxed">
                  &ldquo;Tell me about a project where you had to learn a new technology quickly.
                  What was your approach and what would you do differently?&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error/20">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-error" />
                  </div>
                  <span className="text-sm text-text-muted">Listening to your answer…</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-border/60 bg-background-secondary/50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">How CareerOS works</h2>
              <p className="mt-4 text-text-secondary">
                Go from confused fresher to interview-ready in three clear steps.
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {steps.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="relative rounded-2xl border border-border bg-surface p-6"
                >
                  <span className="text-4xl font-bold text-primary/30">{item.step}</span>
                  <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-surface to-secondary/10 px-6 py-14 text-center sm:px-12">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,124,255,0.15),transparent_55%)]" />
              <div className="relative">
                <GraduationCap className="mx-auto h-10 w-10 text-primary" />
                <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                  Ready to level up your placement prep?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-text-secondary">
                  Join CareerOS and get AI-powered guidance from your first resume draft to your
                  final interview round.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Button size="lg" asChild>
                    <Link to="/register">
                      Create free account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="secondary" asChild>
                    <Link to="/login">Sign in</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>CareerOS — AI Placement Copilot</span>
          </div>
          <p className="text-sm text-text-muted">
            Built for students & freshers in India
          </p>
        </div>
      </footer>
    </div>
  );
}
