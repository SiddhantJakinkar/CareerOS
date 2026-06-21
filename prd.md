# AI Placement Copilot

## Product Requirements Document (PRD)

Version: 1.0

Author: Siddhant Jakinkar

Tech Stack:

* React.js
* Spring Boot
* MongoDB
* Gemini API
* Whisper API
* Text-to-Speech
* Cloudinary

---

# 1. Product Vision

AI Placement Copilot is an AI-powered career preparation platform that helps students become placement-ready through resume analysis, job recommendations, interview preparation, coding assessments, and personalized learning roadmaps.

The platform acts as a personal AI career assistant that guides users from resume creation to job application and interview success.

---

# 2. Problem Statement

Students currently use multiple platforms for:

* Resume Building
* ATS Analysis
* Job Search
* Mock Interviews
* Coding Practice
* Skill Assessment
* Application Tracking

This creates a fragmented experience and reduces placement success.

The platform solves this by providing everything inside a single AI-powered ecosystem.

---

# 3. Target Users

Primary Users

* Engineering Students
* Final Year Students
* Freshers
* Internship Seekers
* Entry-Level Job Seekers

Secondary Users

* Training Institutes
* Placement Cells
* Career Counselors

---

# 4. Key Objectives

1. Improve student placement readiness.
2. Provide AI-powered career guidance.
3. Recommend jobs based on actual skills.
4. Generate job-specific resumes automatically.
5. Improve interview performance.
6. Track complete placement progress.

---

# 5. User Journey

Register
→ Complete Profile
→ Upload Resume
→ ATS Analysis
→ Job Search
→ AI Recommendations
→ Job Details
→ Generate Custom Resume
→ Generate Cover Letter
→ Apply
→ Track Application
→ Mock Interview
→ Improve Skills
→ Get Placed

---

# 6. Core Modules

## Module 1: Authentication & Onboarding

Features

* Email Login
* Google Login
* JWT Authentication
* Forgot Password

Onboarding Information

Personal Information

* Full Name
* Email
* Phone
* Location

Education

* College Name
* Degree
* Branch
* Current Year
* Graduation Year
* CGPA

Career Preferences

* Target Role
* Preferred Locations
* Expected Salary
* Work Mode

Skills

* Technical Skills
* Certifications
* Projects

Resume Upload

* PDF Resume Upload

---

## Module 2: Dashboard

Widgets

* Placement Readiness Score
* ATS Score
* Recommended Jobs
* Skill Gaps
* Coding Progress
* Interview Progress
* Application Tracker
* Recent Activities

Purpose

Provide a complete overview of the user's placement journey.

---

## Module 3: Resume Analyzer

Features

* Resume Upload
* Resume Parsing
* ATS Score Generation
* Keyword Analysis
* Formatting Analysis
* Suggestions

Outputs

* ATS Score
* Missing Skills
* Weak Sections
* Improvement Suggestions

AI Powered By

Gemini API

---

## Module 4: Job Search

Features

* Search Jobs
* Filter Jobs
* Recommended Jobs
* Trending Jobs
* Latest Jobs

Filters

* Role
* Location
* Salary
* Experience
* Job Type
* Work Mode

Job Sources

* Remotive
* Arbeitnow
* JSearch
* Adzuna

Jobs fetched automatically through scheduled services.

---

## Module 5: Job Recommendation Engine

Inputs

* Resume Skills
* Education
* Target Role
* Preferences
* ATS Score
* Coding Scores
* Interview Scores

Outputs

* Match Percentage
* Recommended Jobs
* Missing Skills

Match Formula

40% Skills
20% Preferences
15% Education
10% Coding Score
10% Interview Score
5% Location

---

## Module 6: Job Details

Displays

* Company Information
* Job Description
* Salary
* Benefits
* Requirements
* Responsibilities
* Application Deadline

AI Insights

* Match Score
* Why Recommended
* Missing Skills
* Improvement Tips

Actions

* Generate Resume
* Generate Cover Letter
* Apply
* Save Job

---

## Module 7: AI Resume Generator

Purpose

Generate ATS-optimized resumes for a specific job.

Flow

Job Description
+
User Resume

↓

AI Analysis

↓

Optimized Resume

↓

PDF Export

Features

* Keyword Optimization
* Skills Reordering
* Project Enhancement
* ATS Optimization

---

## Module 8: AI Cover Letter Generator

Purpose

Generate personalized cover letters.

Inputs

* Company Name
* Job Description
* User Profile

Outputs

* Professional Cover Letter
* Editable Content
* PDF Export

---

## Module 9: Application Tracker

Statuses

* Saved
* Applied
* Interview Scheduled
* Rejected
* Selected

Features

* Application Timeline
* Notes
* Status Updates

---

## Module 10: AI Mock Interview

Domains

* Java
* Python
* React
* Spring Boot
* AIML
* HR

Features

* AI Generated Questions
* Answer Evaluation
* Feedback Reports

Outputs

* Technical Score
* Communication Score
* Suggestions

---

## Module 11: Voice Interview

Flow

AI Question

↓

Voice Answer

↓

Whisper Speech-to-Text

↓

Gemini Evaluation

↓

Next Question

Features

* Live Transcript
* Audio Recording
* Voice Feedback

---

## Module 12: Coding Assessment

Categories

* DSA
* Java
* Python
* SQL
* Aptitude

Features

* Timed Tests
* Coding Challenges
* MCQ Assessments

Reports

* Score
* Weak Areas
* Recommendations

---

## Module 13: Skill Gap Analysis

Purpose

Identify missing skills required for the user's target role.

Outputs

* Current Skills
* Missing Skills
* Match Percentage

---

## Module 14: AI Roadmap Generator

Purpose

Generate personalized learning plans.

Example

Backend Developer

Week 1: Spring Boot
Week 2: REST APIs
Week 3: MongoDB
Week 4: Docker
Week 5: AWS

---

## Module 15: LinkedIn Analyzer

Inputs

* LinkedIn Profile URL

Analysis

* Headline
* About Section
* Skills
* Projects
* Experience

Outputs

* Profile Score
* Suggestions

---

## Module 16: Reports & Analytics

Metrics

* ATS Score
* Interview Score
* Coding Score
* Job Match Score
* Placement Readiness

Charts

* Progress Trends
* Skill Growth
* Interview Improvement
* Application Success Rate

---

## Module 17: Profile Management

Editable Information

* Personal Details
* Education
* Preferences
* Skills
* Resume
* LinkedIn
* GitHub
* Portfolio

---

# 7. Database Collections

Users

Profiles

Resumes

Jobs

Applications

Interviews

CodingTests

Roadmaps

Reports

Notifications

ActivityLogs

---

# 8. Non-Functional Requirements

Performance

* API Response < 2 sec
* ATS Analysis < 10 sec

Security

* JWT Authentication
* Password Encryption
* Secure File Upload

Scalability

* Microservice Ready
* Cloud Deployment Ready

---

# 9. Future Enhancements

* AI Career Chatbot
* Company Research Agent
* Salary Prediction
* Resume Version Management
* Auto Apply Assistant
* Interview Recording Analysis
* Placement Cell Dashboard

---

# 10. Success Metrics

* ATS Score Improvement
* Interview Score Improvement
* Job Application Success Rate
* Placement Readiness Growth
* User Retention

---

# Final Product Positioning

AI Placement Copilot is a complete AI-powered placement ecosystem that helps students analyze resumes, discover suitable jobs, prepare for interviews, identify skill gaps, generate optimized resumes, and track their complete placement journey from preparation to employment.
