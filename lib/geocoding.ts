import type { GeoResult } from '@/lib/astro/types';

async function fetchTimeZone(lat: number, lon: number): Promise<{ timeZone?: string; utcOffset?: number }> {
  try {
    const res = await fetch(`/api/timezone?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
    if (!res.ok) return {};
    const data = await res.json();
    if (!data || typeof data.timeZone !== 'string') return {};
    const offset =
      typeof data.gmtOffset === 'number'
        ? Math.round((data.gmtOffset / 3600) * 2) / 2
        : undefined;
    return { timeZone: data.timeZone as string, utcOffset: offset };
  } catch {
    return {};
  }
}

export async function geocodeCity(city: string): Promise<GeoResult> {
  const query = city.trim();
  if (!query) throw new Error('City not found');
  // Normalize case so "SAN FRANCISCO" or "San Francisco" still find the city
  const normalized = query.toLowerCase();
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(normalized)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data.length) throw new Error('City not found');
  const r = data[0];
  const lat = parseFloat(r.lat);
  const lon = parseFloat(r.lon);
  const approxOffset = Math.round(lon / 15);
  const primaryLabel = (r.display_name as string).split(',')[0]?.trim() || query;

  const tz = await fetchTimeZone(lat, lon);
  const finalOffset =
    typeof tz.utcOffset === 'number'
      ? tz.utcOffset
      : approxOffset;

  return {
    latitude: lat,
    longitude: lon,
    utcOffset: finalOffset,
    displayName: primaryLabel,
    timeZone: tz.timeZone,
  };
}

