export type WorkMode = 'remote' | 'hybrid' | 'onsite';

const HYBRID_PATTERN =
  /\bhybrid\b|partially remote|flexible.{0,24}office|work from home.{0,30}office|remote.{0,20}office|office.{0,20}remote|\d+\s*days?.{0,12}office|mix of remote|blend of remote/i;

const REMOTE_PATTERN =
  /\bfully remote\b|100%\s*remote|work from home|work-from-home|\bwfh\b|remote only|work from anywhere|telecommute|remote first|remote-first/i;

const ONSITE_PATTERN =
  /\bonsite\b|on-site|on site|office based|office-based|in-office|in office|work from office|on premises|on-premises/i;

export function inferWorkMode(
  description: string,
  isRemoteFlag?: boolean | null,
  title?: string
): WorkMode {
  const text = `${title ?? ''} ${description}`.toLowerCase();

  if (HYBRID_PATTERN.test(text)) return 'hybrid';
  if (isRemoteFlag === true) {
    if (ONSITE_PATTERN.test(text) || HYBRID_PATTERN.test(text)) return 'hybrid';
    return 'remote';
  }
  if (REMOTE_PATTERN.test(text) && ONSITE_PATTERN.test(text)) return 'hybrid';
  if (REMOTE_PATTERN.test(text)) return 'remote';
  if (ONSITE_PATTERN.test(text)) return 'onsite';
  return 'onsite';
}
