import 'dotenv/config';

const BASE = process.env.API_BASE || 'http://localhost:5000/api';
const TEST_EMAIL = process.env.FEATURE_CHECK_EMAIL || `livecheck_${Date.now()}@test.com`;
const TEST_PASSWORD = process.env.FEATURE_CHECK_PASSWORD || 'LiveCheck@Pass123';

const results = [];

function record(feature, status, detail = '') {
  results.push({ feature, status, detail });
  const icon = status === 'OK' ? '✓' : status === 'WARN' ? '!' : '✗';
  console.log(`${icon} ${feature}: ${status}${detail ? ` — ${detail}` : ''}`);
}

async function reqJson(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function liveTurn(interviewId, opts, token) {
  const form = new FormData();
  form.append('interviewId', interviewId);
  if (opts.transcript) form.append('transcript', opts.transcript);
  if (opts.skipped) form.append('skipped', 'true');
  if (opts.silenceTimeout) form.append('silenceTimeout', 'true');
  if (opts.afterRetry) form.append('afterRetry', 'true');
  if (opts.durationSeconds != null) form.append('durationSeconds', String(opts.durationSeconds));

  const res = await fetch(`${BASE}/interview/live/turn`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function getToken() {
  const reg = await reqJson('POST', '/auth/register', {
    name: 'Live Interview Check',
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (reg.status === 201 && reg.data?.data?.accessToken) return reg.data.data.accessToken;

  const login = await reqJson('POST', '/auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD });
  if (login.status === 200) return login.data.data.accessToken;
  throw new Error(login.data?.message || `Auth failed HTTP ${login.status}`);
}

async function main() {
  console.log('\n=== Live Interview System Check ===\n');

  const health = await reqJson('GET', '/health');
  record('Backend health', health.status === 200 ? 'OK' : 'FAIL', `HTTP ${health.status}`);
  if (health.status !== 200) process.exit(1);

  let token;
  try {
    token = await getToken();
    record('Auth', 'OK');
  } catch (e) {
    record('Auth', 'FAIL', e.message);
    process.exit(1);
  }

  await reqJson(
    'POST',
    '/profile/onboarding',
    {
      academicStream: 'engineering',
      location: 'Bangalore',
      education: { collegeName: 'Test College', degree: 'B.Tech', branch: 'CSE', graduationYear: 2026 },
      careerPreferences: {
        targetRole: 'Software Engineer',
        preferredLocations: ['Bangalore'],
        jobType: 'full-time',
        workMode: 'hybrid',
      },
      skills: {
        languages: ['Python', 'JavaScript'],
        frameworks: ['React'],
        databases: [],
        tools: [],
        certifications: [],
      },
    },
    token
  );

  const start = await reqJson('POST', '/interview/live/start', { domain: 'hr' }, token);
  if (start.status !== 201 || !start.data?.data?.interview?._id) {
    record('Live — Start', 'FAIL', start.data?.message || `HTTP ${start.status}`);
    process.exit(1);
  }

  const interviewId = start.data.data.interview._id;
  const firstQ = start.data.data.currentQuestion;
  record('Live — Start', 'OK', `Q1: ${firstQ.slice(0, 60)}...`);

  const turn1 = await liveTurn(
    interviewId,
    {
      transcript:
        'I am motivated by solving real problems for users. In my last project I led a team of three to deliver a feature on time by breaking work into sprints and communicating daily with stakeholders.',
      durationSeconds: 45,
    },
    token
  );
  if (turn1.status !== 200) {
    record('Live — Answer turn', 'FAIL', turn1.data?.message || `HTTP ${turn1.status}`);
    process.exit(1);
  }
  record(
    'Live — Answer turn',
    'OK',
    `score=${turn1.data.data.evaluation?.score ?? '?'} wasSkipped=${turn1.data.data.wasSkipped}`
  );

  let isComplete = turn1.data.data.isComplete;
  let turnNum = 2;
  const maxQ = turn1.data.data.totalQuestions ?? 6;
  let lastTurnData = turn1.data.data;

  while (!isComplete && turnNum <= maxQ) {
    const turn = await liveTurn(
      interviewId,
      { silenceTimeout: true, afterRetry: true, durationSeconds: 12 },
      token
    );
    if (turn.status !== 200) {
      record(`Live — Skip turn ${turnNum}`, 'FAIL', turn.data?.message || `HTTP ${turn.status}`);
      process.exit(1);
    }
    lastTurnData = turn.data.data;
    record(
      `Live — Skip turn ${turnNum}`,
      'OK',
      `wasSkipped=${turn.data.data.wasSkipped} complete=${turn.data.data.isComplete}`
    );
    isComplete = turn.data.data.isComplete;
    turnNum += 1;
  }

  if (!isComplete) {
    record('Live — Complete flow', 'FAIL', `Stopped at turn ${turnNum - 1}, expected ${maxQ} questions`);
    process.exit(1);
  }
  record('Live — Complete flow', 'OK', `${maxQ} questions processed`);

  if (lastTurnData.interview?.status !== 'completed') {
    record('Live — Interview status', 'FAIL', `status=${lastTurnData.interview?.status}`);
  } else {
    record('Live — Interview status', 'OK', 'completed');
  }

  const report = await reqJson('GET', `/interview/report/${interviewId}`, null, token);
  if (report.status !== 200) {
    record('Live — Report', 'FAIL', report.data?.message || `HTTP ${report.status}`);
    process.exit(1);
  }

  const inv = report.data.data.interview;
  const answers = report.data.data.answers ?? [];
  const hasFeedback = Boolean(inv.feedback?.length > 20);
  const hasSuggestions = Array.isArray(inv.suggestions) && inv.suggestions.length > 0;
  const hasFocusAreas = Array.isArray(inv.focusAreas) && inv.focusAreas.length > 0;
  const hasMetrics = inv.metrics && inv.overallScore >= 0;

  record('Live — Report answers', answers.length === maxQ ? 'OK' : 'WARN', `${answers.length}/${maxQ}`);
  record('Live — Overall review', hasFeedback ? 'OK' : 'FAIL', hasFeedback ? inv.feedback.slice(0, 80) + '...' : 'empty');
  record('Live — Suggestions', hasSuggestions ? 'OK' : 'WARN', `${inv.suggestions?.length ?? 0} items`);
  record('Live — Focus areas', hasFocusAreas ? 'OK' : 'WARN', `${inv.focusAreas?.length ?? 0} items`);
  record('Live — Metrics & score', hasMetrics ? 'OK' : 'FAIL', `score=${inv.overallScore}`);

  const ok = results.filter((r) => r.status === 'OK').length;
  const warn = results.filter((r) => r.status === 'WARN').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  console.log(`\n=== Summary: ${ok} OK, ${warn} warnings, ${fail} failed ===\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
