const BOARD_HOST_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /linkedin\.com/i, label: 'LinkedIn' },
  { pattern: /indeed\.(com|in)/i, label: 'Indeed' },
  { pattern: /naukri\.com/i, label: 'Naukri' },
  { pattern: /internshala\.com/i, label: 'Internshala' },
  { pattern: /apna\.co/i, label: 'Apna' },
  { pattern: /foundit\.(in|com)|monsterindia\.com|monster\.com/i, label: 'Foundit' },
  { pattern: /shine\.com/i, label: 'Shine' },
  { pattern: /timesjobs\.com/i, label: 'TimesJobs' },
  { pattern: /glassdoor\.(com|in)/i, label: 'Glassdoor' },
  { pattern: /wellfound\.com|angel\.co/i, label: 'Wellfound' },
  { pattern: /instahyre\.com/i, label: 'Instahyre' },
  { pattern: /hirist\.com/i, label: 'Hirist' },
  { pattern: /cutshort\.io/i, label: 'Cutshort' },
  { pattern: /remotive\.com/i, label: 'Remotive' },
  { pattern: /adzuna\.(com|in)/i, label: 'Adzuna' },
];

const PUBLISHER_ALIASES: Record<string, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  naukri: 'Naukri',
  internshala: 'Internshala',
  apna: 'Apna',
  foundit: 'Foundit',
  monster: 'Foundit',
  shine: 'Shine',
  timesjobs: 'TimesJobs',
  glassdoor: 'Glassdoor',
  google: 'Google Jobs',
  simplyhired: 'SimplyHired',
  ziprecruiter: 'ZipRecruiter',
};

export function inferJobPublisher(applyUrl?: string, rawPublisher?: string): string {
  if (applyUrl) {
    for (const { pattern, label } of BOARD_HOST_PATTERNS) {
      if (pattern.test(applyUrl)) return label;
    }
  }

  if (rawPublisher?.trim()) {
    const key = rawPublisher.trim().toLowerCase().replace(/\s+/g, '');
    for (const [alias, label] of Object.entries(PUBLISHER_ALIASES)) {
      if (key.includes(alias)) return label;
    }
    return rawPublisher.trim();
  }

  return 'Other';
}

export const INDIA_JOB_BOARDS = [
  'LinkedIn',
  'Indeed',
  'Naukri',
  'Internshala',
  'Apna',
  'Foundit',
  'Shine',
  'TimesJobs',
  'Glassdoor',
  'Hirist',
  'Instahyre',
  'Cutshort',
  'Google Jobs',
  'Adzuna',
  'Remotive',
] as const;
