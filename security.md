# SECURITY.md

# AI Placement Copilot Security Standards

Version: 1.0

---

# Security Philosophy

Security is a core requirement of this application.

All code, APIs, AI integrations, file uploads, and user-generated content must follow the security standards defined in this document.

No feature should be implemented at the cost of security.

---

# 1. Secrets Management

## Rules

* Never hardcode API keys.
* Never expose secrets in frontend code.
* Store all secrets in environment variables.
* Generate .env.example for required variables.
* .env files must never be committed.

## Required Environment Variables

JWT_SECRET

MONGODB_URI

GEMINI_API_KEY

WHISPER_API_KEY

CLOUDINARY_CLOUD_NAME

CLOUDINARY_API_KEY

CLOUDINARY_API_SECRET

JSEARCH_API_KEY

GOOGLE_CLIENT_ID

GOOGLE_CLIENT_SECRET

SESSION_SECRET

---

# 2. Authentication Security

## Requirements

* JWT Authentication
* Password Hashing using bcrypt
* Minimum bcrypt salt rounds: 12
* Access token expiration: 15 minutes
* Refresh token expiration: 7 days

## Password Rules

Minimum 8 characters

At least:

* One uppercase letter
* One lowercase letter
* One number
* One special character

## Account Protection

Lock account after:

5 failed login attempts

Lock duration:

15 minutes

---

# 3. Authorization

Every protected API must verify:

1. User Identity
2. Resource Ownership
3. User Permissions

Example:

User can only access:

* Own Profile
* Own Resume
* Own Applications
* Own Reports

Admin-only routes require explicit role checks.

---

# 4. API Security

## Global Rate Limits

General API

60 requests/minute

Auth APIs

5 requests/15 minutes

AI APIs

10 requests/minute/user

Upload APIs

5 requests/minute

## Response Codes

200 Success

400 Validation Error

401 Unauthorized

403 Forbidden

404 Not Found

429 Too Many Requests

500 Internal Error

---

# 5. Input Validation

All inputs must be validated on the server.

Validation Library:

Zod

Validate:

* Data Types
* Length
* Required Fields
* Enums
* URLs
* Email Formats

Reject invalid input immediately.

Never trust frontend validation.

---

# 6. MongoDB Security

## Rules

Use Mongoose Models only.

Never use raw user input directly in queries.

Always sanitize:

* Search Queries
* Filters
* User IDs

Prevent:

* NoSQL Injection
* Query Injection

Database user must have least privilege permissions.

---

# 7. Resume Upload Security

Supported Types:

PDF

DOCX

Maximum Size:

10 MB

Validation Required:

* MIME Type
* Extension
* File Size

Uploaded files must:

* Be renamed using UUID
* Be stored in Cloudinary
* Never be executed

Malicious files must be rejected.

---

# 8. AI Security

AI features are core functionality.

Special protection is required.

---

## Gemini API Rules

Never call Gemini directly from frontend.

All requests must go through backend.

Flow:

Frontend

↓

Express Server

↓

Gemini API

---

## Prompt Injection Protection

Sanitize:

* Resume Content
* Interview Answers
* User Messages
* Job Descriptions

Never allow user prompts to override system instructions.

---

## Token Cost Protection

Maximum Token Limits

ATS Analysis:

4000 tokens

Interview Evaluation:

3000 tokens

Resume Generation:

5000 tokens

Cover Letter:

2500 tokens

Roadmap:

2000 tokens

---

## Usage Monitoring

Track:

User ID

Tokens Used

Requests Made

Feature Access

Detect abuse automatically.

---

# 9. XSS Protection

Never render raw HTML.

Forbidden:

dangerouslySetInnerHTML

innerHTML

eval()

new Function()

If HTML rendering becomes necessary:

Use DOMPurify.

---

# 10. CORS Security

Allowed Origins

Development

http://localhost:5173

Production

Frontend Domain Only

Wildcard origins are forbidden.

Example:

https://app.aiplacementcopilot.com

---

# 11. HTTP Security Headers

Use Helmet Middleware.

Enable:

Content-Security-Policy

X-Frame-Options

X-Content-Type-Options

HSTS

Referrer-Policy

Remove:

X-Powered-By

---

# 12. Job API Security

External Sources

Remotive

Arbeitnow

JSearch

Security Rules

* Validate API responses
* Sanitize all fetched content
* Never trust third-party data
* Cache responses

Rate limit external API usage.

---

# 13. Cloudinary Security

Store:

* Resume PDFs
* Generated Resumes
* Profile Images

Rules:

* Private Upload Presets
* Signed Uploads
* File Type Restrictions
* Access Control Enabled

---

# 14. Logging & Monitoring

Log:

Authentication Events

Resume Uploads

AI Requests

Application Events

Errors

Security Violations

Never Log:

Passwords

JWT Tokens

API Keys

Personal Sensitive Data

---

# 15. Error Handling

Users should never see:

Stack Traces

Database Errors

Internal Paths

Dependency Information

Show Generic Messages:

"Something went wrong."

Detailed errors remain server-side.

---

# 16. Dependency Security

Before every deployment:

npm audit

npm audit fix

Update critical packages immediately.

Only use maintained packages.

Pin package versions.

---

# 17. Production Deployment Checklist

Before Release

✓ HTTPS Enabled

✓ JWT Secret Configured

✓ MongoDB Access Restricted

✓ Environment Variables Set

✓ Cloudinary Configured

✓ Rate Limiting Enabled

✓ Helmet Enabled

✓ CORS Restricted

✓ Logging Enabled

✓ File Validation Enabled

✓ AI Token Limits Enabled

✓ Error Handling Enabled

✓ Security Headers Enabled

---

# 18. AI Placement Copilot Specific Security Rules

Custom Resume Generation

* Validate Job Description
* Validate Resume Content
* Sanitize AI Output

Cover Letter Generation

* Validate Company Data
* Sanitize Generated Content

Voice Interview

* Accept Audio Files Only
* Limit Recording Length
* Delete Temporary Files

Job Recommendations

* Validate External Job Sources
* Sanitize Job Descriptions
* Remove Malicious Content

Application Tracker

* User can access only their own applications.

Reports

* User can access only their own reports.

---

# Security Principle

Never Trust:

* User Input
* AI Output
* Uploaded Files
* External APIs
* Browser Data

Always:

Validate

Sanitize

Authorize

Log

Monitor

Protect
