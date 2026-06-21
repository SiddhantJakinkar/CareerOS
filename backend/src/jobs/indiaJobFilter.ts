import { isIndiaJob, normalizeIndiaLocation } from '../constants/indiaJobs.js';

export function isIndiaCountryCode(country?: string): boolean {
  const value = (country ?? '').trim().toLowerCase();
  return value === 'in' || value === 'india';
}

export function buildJobLocation(city?: string, state?: string, country?: string): string {
  const countryLabel = isIndiaCountryCode(country) ? 'India' : country;
  return [city, state, countryLabel].filter(Boolean).join(', ') || 'India';
}

export function acceptIndiaJob(
  location: string,
  description: string,
  country?: string
): boolean {
  if (isIndiaCountryCode(country)) return true;
  return isIndiaJob(location, description);
}

export function resolveIndiaLocation(
  city?: string,
  state?: string,
  country?: string
): string {
  const built = buildJobLocation(city, state, country);
  return normalizeIndiaLocation(built, city || 'India');
}
