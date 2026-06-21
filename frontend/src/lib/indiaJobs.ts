export const INDIA_CITIES = [
  'India (All)',
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Gurgaon',
  'Noida',
  'Ahmedabad',
  'Jaipur',
  'Kochi',
  'Indore',
  'Lucknow',
  'Chandigarh',
] as const;

export function getDefaultIndiaLocation(profile?: {
  location?: string;
  careerPreferences?: { preferredLocations?: string[] };
} | null): string {
  const preferred = profile?.careerPreferences?.preferredLocations?.[0];
  if (preferred?.trim()) return preferred.trim();
  if (profile?.location?.trim()) return profile.location.trim();
  return 'India';
}
