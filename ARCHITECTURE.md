# Architecture Blueprint

## Product Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CareerOS (Frontend)                       │
│  React + Vite + Tailwind + shadcn/ui + Framer Motion        │
├─────────────────────────────────────────────────────────────┤
│  Auth │ Dashboard │ Jobs │ Resume │ Interview │ Coding │ ... │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (JWT)
┌──────────────────────────▼──────────────────────────────────┐
│                  Express API Gateway                           │
│  Helmet │ CORS │ Rate Limit │ Validation │ Auth Middleware    │
├─────────────────────────────────────────────────────────────┤
│  Controllers → Services → Repositories (Mongoose Models)     │
├──────────────┬──────────────────────┬─────────────────────────┤
│  Gemini AI   │  Whisper STT         │  Job Fetcher (Cron)     │
│  Cloudinary  │  MongoDB Atlas       │  Remotive/Arbeitnow     │
└──────────────┴──────────────────────┴─────────────────────────┘
```

## Recommendation Engine Formula

| Factor | Weight |
|--------|--------|
| Skills Match | 40% |
| Career Preferences | 20% |
| Education | 15% |
| Coding Score | 10% |
| Interview Score | 10% |
| Location | 5% |

## Placement Readiness

`(ATS + Coding + Interview + Job Match) / 4`

## Database Collections

users, profiles, resumes, jobs, saved_jobs, applications, interviews, interview_answers, coding_tests, coding_results, reports, roadmaps, notifications, activity_logs, cover_letters, token_usage

## MVP vs Phase 2

### MVP (Implemented)
- Authentication & Onboarding
- Dashboard with placement readiness
- Resume upload & ATS analysis
- Job search & recommendations
- Job details with AI match
- Resume & cover letter generation
- Application tracker
- AI mock interview
- Voice interview
- Coding assessments
- Skill gap analysis
- Learning roadmap
- LinkedIn analyzer
- Reports & analytics

### Phase 2 (Complete)
- AI Career Chatbot ✅
- Company Research Agent ✅
- Salary Prediction Engine ✅
- Auto Apply Assistant ✅
- Placement Cell Dashboard ✅
- Video Interview Analysis ✅

## Development Roadmap

1. **Week 1-2**: Auth, profile, database schemas
2. **Week 3-4**: Resume analyzer, job search, recommendation engine
3. **Week 5-6**: Interview modules, coding assessments
4. **Week 7-8**: Skill gap, roadmap, LinkedIn, reports
5. **Week 9-10**: Polish, security audit, deployment
