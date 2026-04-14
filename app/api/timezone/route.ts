import { NextResponse } from 'next/server';

const TIMEZONEDB_BASE = 'https://api.timezonedb.com/v2.1/get-time-zone';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  const parsedLat = Number(lat);
  const parsedLon = Number(lon);
  if (
    !Number.isFinite(parsedLat) ||
    !Number.isFinite(parsedLon) ||
    parsedLat < -90 ||
    parsedLat > 90 ||
    parsedLon < -180 ||
    parsedLon > 180
  ) {
    return NextResponse.json({ error: 'lat/lon must be valid coordinates' }, { status: 400 });
  }

  const apiKey = process.env.TIMEZONEDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'timezone backend not configured' }, { status: 500 });
  }

  const url = `${TIMEZONEDB_BASE}?key=${encodeURIComponent(apiKey)}&format=json&by=position&lat=${encodeURIComponent(
    String(parsedLat),
  )}&lng=${encodeURIComponent(String(parsedLon))}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'failed to fetch timezone' }, { status: 502 });
    }
    const data = await res.json();
    if (data.status !== 'OK' || !data.zoneName) {
      return NextResponse.json({ error: 'invalid timezone response' }, { status: 502 });
    }
    return NextResponse.json({
      timeZone: data.zoneName as string,
      gmtOffset: data.gmtOffset as number,
      dst: data.dst as string | number | undefined,
    });
  } catch {
    return NextResponse.json({ error: 'timezone lookup failed' }, { status: 502 });
  }
}

