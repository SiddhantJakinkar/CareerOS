/** India-only job filtering for CareerOS (placement platform for Indian students). */

export const INDIA_CITIES = [
  'Bangalore',
  'Bengaluru',
  'Mumbai',
  'Delhi',
  'New Delhi',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Gurgaon',
  'Gurugram',
  'Noida',
  'Ahmedabad',
  'Kochi',
  'Jaipur',
  'Indore',
  'Lucknow',
  'Chandigarh',
  'Bhopal',
  'Coimbatore',
  'Nagpur',
  'Visakhapatnam',
  'Surat',
  'Thiruvananthapuram',
] as const;

export const INDIA_LOCATION_PATTERN =
  /india|bangalore|bengaluru|mumbai|delhi|new delhi|hyderabad|pune|chennai|kolkata|gurgaon|gurugram|noida|ahmedabad|kochi|jaipur|indore|lucknow|chandigarh|bhopal|coimbatore|nagpur|visakhapatnam|vadodara|surat|thiruvananthapuram|tamil nadu|karnataka|maharashtra|telangana|uttar pradesh|west bengal|gujarat|rajasthan|kerala|madhya pradesh|punjab|andhra pradesh/i;

export function isIndiaJob(location?: string, description?: string): boolean {
  const text = `${location ?? ''} ${description ?? ''}`.trim();
  if (!text) return false;
  return INDIA_LOCATION_PATTERN.test(text);
}

export function normalizeIndiaLocation(location: string, fallbackCity = 'India'): string {
  if (isIndiaJob(location)) return location;
  return fallbackCity;
}

export function buildIndiaLocationMongoQuery(cityFilter?: string): Record<string, unknown> {
  if (cityFilter?.trim() && cityFilter.toLowerCase() !== 'india') {
    return {
      location: {
        $regex: cityFilter.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i',
      },
    };
  }
  return { location: { $regex: INDIA_LOCATION_PATTERN.source, $options: 'i' } };
}

export const INDIA_JOB_SEARCH_QUERIES = [
  'internship Bangalore',
  'graduate trainee Mumbai',
  'fresher Hyderabad',
  'software developer Pune',
  'marketing executive Delhi',
  'accounts executive Chennai',
  'legal associate India',
  'healthcare nursing India',
  'campus placement India',
  'management trainee India',
];
