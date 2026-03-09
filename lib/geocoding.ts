import type { GeoResult } from '@/lib/astro/types';

export async function geocodeCity(city: string): Promise<GeoResult> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data.length) throw new Error('City not found');
  const r = data[0];
  const lat = parseFloat(r.lat);
  const lon = parseFloat(r.lon);
  const utcOffset = Math.round(lon / 15);
  return {
    latitude: lat,
    longitude: lon,
    utcOffset,
    displayName: r.display_name.split(',').slice(0, 3).join(', '),
  };
}
