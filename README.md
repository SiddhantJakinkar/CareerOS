# CareerOS — AI Placement Copilot

A production-grade AI-powered career operating system for students and freshers. Combines ATS resume analysis, AI job recommendations, mock interviews, voice interviews, coding assessments, skill gap analysis, learning roadmaps, LinkedIn analysis, and application tracking.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Zustand, TanStack Query |
| Backend | Node.js, Express, TypeScript, JWT, bcrypt |
| Database | MongoDB Atlas, Mongoose |
| AI | Google Gemini API, OpenAI Whisper API, Web Speech API |
| Storage | Cloudinary |
| Job APIs | Remotive, Arbeitnow, JSearch |

## Project Structure

```
ai/
├── backend/                 # Express API server
│   └── src/
│       ├── ai/              # Gemini & Whisper services
│       ├── config/          # Database, Cloudinary, env
│       ├── controllers/     # Route handlers
│       ├── jobs/            # External job fetcher
│       ├── middleware/      # Auth, rate limit, upload
│       ├── models/          # Mongoose schemas
│       ├── routes/          # API routes
│       ├── scheduler/       # Cron jobs
│       ├── services/        # Business logic
│       └── utils/           # Helpers
├── frontend/                # React SPA
│   └── src/
│       ├── components/      # UI & layout
│       ├── pages/           # Feature pages
│       ├── services/        # API client
│       ├── store/           # Zustand state
│       └── types/           # TypeScript types
└── docs/                    # PRD, TRD, design specs
```

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Gemini API key
- Cloudinary account

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | POST /auth/register, /login, /google, /refresh, /logout, GET /me |
| Profile | GET/PUT /profile, POST /profile/onboarding |
| Resume | POST /resume/upload, /analyze, /generate, GET /report |
| Jobs | GET /jobs, /recommended, /trending, /latest, /:id, /:id/match |
| Applications | GET/POST /applications, PATCH /:id, cover letter routes |
| Interview | POST /interview/start, /answer, GET /report/:id |
| Voice | POST /voice/transcribe, /evaluate |
| Coding | GET /tests, /:id, POST /submit |
| Skills | GET /skills/gap, POST/GET /skills/roadmap |
| LinkedIn | POST /linkedin/analyze |
| Dashboard | GET /dashboard, /reports, /analytics |
| Chat | GET/POST /chat, DELETE /chat/:id |
| Insights | POST /insights/company-research, /salary-prediction, /auto-apply/:jobId |
| Placement | GET /placement/overview, /colleges, /students/:id (counselor/admin) |
| Video Interview | GET/POST /video-interview, DELETE /video-interview/:id |

## Counselor / Admin Access

To enable the Placement Cell Dashboard, set a user's role in MongoDB:

```javascript
db.users.updateOne({ email: "counselor@college.edu" }, { $set: { role: "counselor" } })
```

Roles: `user` (default), `counselor`, `admin`

## Security & Production Upgrades

- **httpOnly refresh cookies** — refresh token not stored in `localStorage` (XSS-safe)
- **CSRF protection** — double-submit token on cookie-auth routes (`/auth/refresh`, `/auth/logout`)
- **Access token in memory** — short-lived JWT kept in session memory only
- **Redis cache** (optional `REDIS_URL`) — shared cache across instances; falls back to in-memory
- **API versioning** — `/api/v1/*` and `/api/*` (same routes)
- **Helmet CSP** — Content-Security-Policy headers
- **Audit logging** — security events in `AuditLog` collection
- **Email verification** — on register (SMTP optional; dev logs link)
- **2FA (TOTP)** — admin/counselor accounts via `/auth/2fa/setup`
- **File upload validation** — MIME + magic-byte checks for resumes
- **Sentry** (optional `SENTRY_DSN`) — error monitoring
- bcrypt password hashing, rate limiting, Zod validation, AI prompt sanitization

### Optional env vars

See `backend/.env.example` for `REDIS_URL`, `SENTRY_DSN`, and `SMTP_*` settings.

## License

Proprietary — Siddhant Jakinkar
