# TRD.md

# AI Placement Copilot

Version: 1.0

---

# 1. Technical Overview

AI Placement Copilot is a full-stack AI-powered career preparation platform that provides:

* ATS Resume Analysis
* Job Recommendations
* AI Mock Interviews
* Voice Interviews
* Coding Assessments
* Skill Gap Analysis
* Job-Specific Resume Generation
* Cover Letter Generation
* Application Tracking

Architecture follows a modern MERN-style approach using React, Express.js, MongoDB, and AI services.

---

# 2. Technology Stack

## Frontend

Framework:

* React.js
* TypeScript
* Vite

UI:

* Tailwind CSS
* shadcn/ui

Animation:

* Framer Motion

Charts:

* Recharts

Forms:

* React Hook Form
* Zod

State Management:

* Zustand

Data Fetching:

* TanStack Query

---

## Backend

Runtime:

* Node.js

Framework:

* Express.js

Language:

* TypeScript

Authentication:

* JWT
* bcrypt

Validation:

* Zod

File Upload:

* Multer

Scheduling:

* node-cron

---

## Database

MongoDB Atlas

ODM:

* Mongoose

---

## AI Services

Gemini API

Features:

* Resume Analysis
* ATS Scoring
* Job Matching
* Resume Generation
* Cover Letter Generation
* Interview Evaluation
* Skill Gap Analysis
* Roadmap Generation

Whisper API

Features:

* Speech To Text
* Voice Interview Processing

Web Speech API

Features:

* Text To Speech
* AI Interview Voice

---

## Storage

Cloudinary

Store:

* Resume PDFs
* Generated Resumes
* Profile Images

---

# 3. System Architecture

Frontend

React Application

↓

API Gateway

Express Server

↓

Business Layer

Services

↓

Database Layer

MongoDB

↓

External Services

Gemini API
Whisper API
Cloudinary
Job APIs

---

# 4. Frontend Architecture

src/

app/

components/

features/

pages/

layouts/

routes/

hooks/

store/

services/

types/

utils/

assets/

---

# 5. Backend Architecture

src/

config/

controllers/

routes/

middleware/

models/

services/

repositories/

ai/

jobs/

scheduler/

utils/

types/

server.ts

---

# 6. Core Modules

## Authentication Module

Features

* Registration
* Login
* Logout
* JWT Authentication
* Google OAuth
* Password Reset

Endpoints

POST /api/auth/register

POST /api/auth/login

POST /api/auth/logout

GET /api/auth/me

---

## User Profile Module

Stores:

Personal Details

Education Details

Career Preferences

Skills

Resume

Social Links

Endpoints

GET /api/profile

PUT /api/profile

---

## Resume Module

Features

Upload Resume

Resume Parsing

ATS Analysis

Skill Extraction

Keyword Analysis

Resume Suggestions

Endpoints

POST /api/resume/upload

GET /api/resume/report

POST /api/resume/analyze

---

## Job Search Module

Features

Job Search

Filters

Recommendations

Job Details

Saved Jobs

Endpoints

GET /api/jobs

GET /api/jobs/:id

GET /api/jobs/recommended

POST /api/jobs/save

---

## Resume Generator Module

Features

Job Specific Resume

ATS Optimization

PDF Generation

Endpoints

POST /api/resume/generate

GET /api/resume/download/:id

---

## Cover Letter Module

Features

Company Specific Cover Letter

Endpoints

POST /api/cover-letter/generate

---

## Application Tracking Module

Features

Track Applications

Status Management

Application Notes

Endpoints

POST /api/applications

GET /api/applications

PATCH /api/applications/:id

---

## Interview Module

Features

Mock Interview

Question Generation

Answer Evaluation

Feedback Reports

Endpoints

POST /api/interview/start

POST /api/interview/answer

GET /api/interview/report/:id

---

## Voice Interview Module

Features

Voice Input

Speech To Text

AI Evaluation

Endpoints

POST /api/voice/upload

POST /api/voice/evaluate

---

## Coding Assessment Module

Features

MCQs

Coding Questions

Scoring

Reports

Endpoints

GET /api/tests

POST /api/tests/start

POST /api/tests/submit

---

## Skill Gap Module

Features

Skill Comparison

Roadmap Generation

Endpoints

GET /api/skills/gap

POST /api/roadmap/generate

---

# 7. Database Collections

users

profiles

resumes

jobs

saved_jobs

applications

interviews

interview_answers

coding_tests

coding_results

roadmaps

notifications

activity_logs

reports

---

# 8. MongoDB Schema Overview

Users

_id

name

email

password

role

createdAt

updatedAt

Profiles

userId

phone

location

college

degree

branch

cgpa

graduationYear

targetRole

preferredLocations

skills

experience

githubUrl

linkedinUrl

portfolioUrl

resumeUrl

---

Jobs

jobId

title

company

location

salary

experience

description

requirements

skills

source

postedAt

---

Applications

userId

jobId

status

notes

appliedAt

updatedAt

---

# 9. Job Recommendation Engine

Inputs

Resume Skills

Career Preferences

Education

Interview Scores

Coding Scores

Location

Outputs

Match Score

Recommended Jobs

Missing Skills

Formula

Skills Weight = 40%

Preferences Weight = 20%

Education Weight = 15%

Coding Score = 10%

Interview Score = 10%

Location = 5%

---

# 10. ATS Resume Engine

Process

Upload Resume

↓

Extract Text

↓

Extract Skills

↓

Compare Keywords

↓

Calculate ATS Score

↓

Generate Suggestions

Outputs

ATS Score

Missing Keywords

Weak Sections

Recommendations

---

# 11. Placement Readiness Engine

Factors

ATS Score

Coding Score

Interview Score

Job Match Score

Formula

Placement Readiness =
(ATS + Coding + Interview + Skill Match) / 4

---

# 12. Background Jobs

Job Fetch Scheduler

Runs Every 6 Hours

Tasks

Fetch Jobs

Update Job Database

Remove Expired Jobs

Generate Recommendations

---

# 13. Security Requirements

JWT Authentication

Password Hashing

Role-Based Access

Secure File Upload

Input Validation

Rate Limiting

Helmet Security Headers

CORS Protection

---

# 14. Performance Requirements

API Response

< 2 Seconds

Resume Analysis

< 10 Seconds

Job Search

< 1 Second

Dashboard Load

< 3 Seconds

---

# 15. Deployment Architecture

Frontend

Vercel

Backend

Render

Database

MongoDB Atlas

Storage

Cloudinary

AI Services

Gemini API

Whisper API

---

# 16. Future Scalability

Microservice Ready

Redis Caching

WebSocket Notifications

Company Dashboard

Placement Cell Dashboard

AI Career Assistant

Auto Apply Engine

Salary Prediction Engine

Interview Video Analysis

---

# Final Technical Goal

Build a scalable AI-powered placement ecosystem that helps students analyze resumes, discover jobs, prepare for interviews, identify skill gaps, generate optimized resumes, and track their complete placement journey using modern web technologies and artificial intelligence.
