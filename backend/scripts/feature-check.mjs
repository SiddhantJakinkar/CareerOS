import 'dotenv/config';

const BASE = process.env.API_BASE || 'http://localhost:5000/api';
const TEST_EMAIL = process.env.FEATURE_CHECK_EMAIL || `featurecheck_${Date.now()}@test.com`;
const TEST_PASSWORD = process.env.FEATURE_CHECK_PASSWORD;

const results = [];

function record(feature, status, detail = '') {
  results.push({ feature, status, detail });
  const icon = status === 'OK' ? '✓' : status === 'WARN' ? '!' : '✗';
  console.log(`${icon} ${feature}: ${status}${detail ? ` — ${detail}` : ''}`);
}

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function main() {
  console.log('\n=== CareerOS Feature Check ===\n');

  if (!TEST_PASSWORD) {
    console.error('Set FEATURE_CHECK_PASSWORD in backend/.env (or env) before running feature-check.');
    console.error('Example: FEATURE_CHECK_PASSWORD=YourTest@Pass1');
    process.exit(1);
  }

  // Health
  try {
    const h = await req('GET', '/health');
    record('Backend health', h.status === 200 ? 'OK' : 'FAIL', `HTTP ${h.status}`);
  } catch (e) {
    record('Backend health', 'FAIL', e.message);
    console.log('\nBackend not reachable. Start with: cd backend && npm run dev\n');
    process.exit(1);
  }

  // Register + Login
  let token = '';
  let refreshToken = '';
  const reg = await req('POST', '/auth/register', {
    name: 'Feature Check User',
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (reg.status === 201 && reg.data?.data?.accessToken) {
    token = reg.data.data.accessToken;
    refreshToken = reg.data.data.refreshToken;
    record('Auth — Register', 'OK');
  } else {
    record('Auth — Register', 'FAIL', reg.data?.message || `HTTP ${reg.status}`);
  }

  const login = await req('POST', '/auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD });
  if (login.status === 200) {
    token = login.data.data.accessToken;
    refreshToken = login.data.data.refreshToken;
    record('Auth — Login', 'OK');
  } else {
    record('Auth — Login', 'FAIL', login.data?.message || `HTTP ${login.status}`);
  }

  const refresh = await req('POST', '/auth/refresh', { refreshToken });
  record('Auth — Token refresh', refresh.status === 200 ? 'OK' : 'FAIL', refresh.data?.message || `HTTP ${refresh.status}`);
  if (refresh.status === 200) token = refresh.data.data.accessToken;

  const me = await req('GET', '/auth/me', null, token);
  record('Auth — Get me', me.status === 200 ? 'OK' : 'FAIL', me.data?.message || `HTTP ${me.status}`);

  // Onboarding / Profile
  const onboarding = await req('POST', '/profile/onboarding', {
    academicStream: 'engineering',
    location: 'Bangalore',
    education: { collegeName: 'Test College', degree: 'B.Tech', branch: 'CSE', graduationYear: 2026 },
    careerPreferences: { targetRole: 'Software Engineer', preferredLocations: ['Bangalore'], jobType: 'full-time', workMode: 'hybrid' },
    skills: { languages: ['Python', 'JavaScript'], frameworks: ['React'], databases: [], tools: [], certifications: [] },
  }, token);
  record('Profile — Onboarding', onboarding.status === 200 ? 'OK' : 'FAIL', onboarding.data?.message || `HTTP ${onboarding.status}`);

  const profile = await req('GET', '/profile', null, token);
  record('Profile — Get', profile.status === 200 ? 'OK' : 'FAIL', profile.data?.message || `HTTP ${profile.status}`);

  const profileUpdate = await req('PUT', '/profile', {
    phone: '9876543210',
    location: 'Mumbai',
    skills: { languages: ['Python', 'React', 'SQL'], frameworks: [], databases: [], tools: [], certifications: [] },
    careerPreferences: { targetRole: 'Full Stack Developer', preferredLocations: ['Mumbai'], jobType: 'full-time', workMode: 'onsite' },
  }, token);
  record('Profile — Update', profileUpdate.status === 200 ? 'OK' : 'FAIL', profileUpdate.data?.message || `HTTP ${profileUpdate.status}`);

  // Jobs
  const jobs = await req('GET', '/jobs?limit=5&location=India', null, token);
  const jobCount = jobs.data?.data?.total ?? 0;
  record('Jobs — Search', jobs.status === 200 ? 'OK' : 'FAIL', jobs.status === 200 ? `${jobCount} jobs` : jobs.data?.message);

  const trending = await req('GET', '/jobs/trending', null, token);
  record('Jobs — Trending', trending.status === 200 ? 'OK' : 'FAIL');

  const latest = await req('GET', '/jobs/latest', null, token);
  record('Jobs — Latest', latest.status === 200 ? 'OK' : 'FAIL');

  const recommended = await req('GET', '/jobs/recommended', null, token);
  record('Jobs — Recommended', recommended.status === 200 ? 'OK' : 'FAIL');

  const syncStatus = await req('GET', '/jobs/sync/status', null, token);
  record('Jobs — Sync status', syncStatus.status === 200 ? 'OK' : 'FAIL');

  let jobId = jobs.data?.data?.jobs?.[0]?._id;
  if (jobId) {
    const jobDetail = await req('GET', `/jobs/${jobId}`, null, token);
    record('Jobs — Detail', jobDetail.status === 200 ? 'OK' : 'FAIL');
  } else {
    record('Jobs — Detail', 'WARN', 'No jobs in DB to test');
  }

  // Dashboard
  const dashboard = await req('GET', '/dashboard', null, token);
  record('Dashboard', dashboard.status === 200 ? 'OK' : 'FAIL', dashboard.data?.message || `HTTP ${dashboard.status}`);

  const analytics = await req('GET', '/dashboard/analytics', null, token);
  record('Reports — Analytics', analytics.status === 200 ? 'OK' : 'FAIL');

  // Applications
  if (jobId) {
    const appCreate = await req('POST', '/applications', { jobId, status: 'saved' }, token);
    record('Applications — Create', appCreate.status === 201 || appCreate.status === 200 ? 'OK' : 'FAIL', appCreate.data?.message);
    const appId = appCreate.data?.data?._id;
    if (appId) {
      const appUpdate = await req('PATCH', `/applications/${appId}`, { status: 'applied' }, token);
      record('Applications — Update status', appUpdate.status === 200 ? 'OK' : 'FAIL');
    }
  } else {
    record('Applications — Create', 'WARN', 'Skipped — no job');
  }

  const apps = await req('GET', '/applications', null, token);
  record('Applications — List', apps.status === 200 ? 'OK' : 'FAIL');

  // Notifications
  const notifs = await req('GET', '/notifications', null, token);
  record('Notifications — List', notifs.status === 200 ? 'OK' : 'FAIL');

  const unread = await req('GET', '/notifications/unread-count', null, token);
  record('Notifications — Unread count', unread.status === 200 ? 'OK' : 'FAIL');

  // Resume
  const resumes = await req('GET', '/resume', null, token);
  record('Resume — List', resumes.status === 200 ? 'OK' : 'FAIL', resumes.data?.data?.length ? `${resumes.data.data.length} resume(s)` : 'none uploaded');

  const resumeReport = await req('GET', '/resume/report', null, token);
  record('Resume — Report', resumeReport.status === 200 ? 'OK' : resumeReport.status === 404 ? 'WARN' : 'FAIL', resumeReport.status === 404 ? 'No resume uploaded' : '');

  // Skills
  const skillGap = await req('GET', '/skills/gap?targetRole=Software%20Engineer', null, token);
  record('Skill Gap — Analysis', skillGap.status === 200 ? 'OK' : 'FAIL', skillGap.data?.message || `HTTP ${skillGap.status}`);

  const roadmap = await req('POST', '/skills/roadmap', { targetRole: 'Software Engineer' }, token);
  record('Roadmap — Generate', roadmap.status === 200 ? 'OK' : roadmap.status === 429 ? 'WARN' : 'FAIL', roadmap.data?.message || `HTTP ${roadmap.status}`);

  // Coding tests
  const tests = await req('GET', '/tests', null, token);
  record('Coding — List tests', tests.status === 200 ? 'OK' : 'FAIL', tests.data?.message || `HTTP ${tests.status}`);

  // Interview
  const interviewDomains = await req('GET', '/interview/domains', null, token);
  record('Interview — Domains', interviewDomains.status === 200 ? 'OK' : 'FAIL');

  // Chat
  const chatHistory = await req('GET', '/chat', null, token);
  record('Career Chat — History', chatHistory.status === 200 ? 'OK' : 'FAIL', chatHistory.data?.message || `HTTP ${chatHistory.status}`);

  // LinkedIn
  const linkedin = await req('POST', '/linkedin/analyze', {
    linkedinUrl: 'https://www.linkedin.com/in/test-user',
    profileContent: 'Software engineer with 2 years experience in React and Node.js. Built scalable web applications. Skills: JavaScript, Python, MongoDB, REST APIs, Git.',
  }, token);
  record('LinkedIn — Analyze', linkedin.status === 200 ? 'OK' : linkedin.status === 429 ? 'WARN' : 'FAIL', linkedin.data?.message || `HTTP ${linkedin.status}`);

  // Insights (job-level, still on backend)
  if (jobId) {
    const salary = await req('POST', '/insights/salary-prediction', { jobId }, token);
    record('Insights — Salary (job detail)', salary.status === 200 ? 'OK' : salary.status === 429 ? 'WARN' : 'FAIL', salary.data?.message || `HTTP ${salary.status}`);
  }

  // Summary
  const ok = results.filter((r) => r.status === 'OK').length;
  const warn = results.filter((r) => r.status === 'WARN').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  console.log(`\n=== Summary: ${ok} OK, ${warn} warnings, ${fail} failed ===\n`);

  if (fail > 0) {
    console.log('Failed features:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  - ${r.feature}: ${r.detail}`));
  }
  if (warn > 0) {
    console.log('Warnings (expected if no data):');
    results.filter((r) => r.status === 'WARN').forEach((r) => console.log(`  - ${r.feature}: ${r.detail}`));
  }

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
