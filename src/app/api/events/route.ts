import { NextRequest, NextResponse } from 'next/server';
import { MOCK_EVENTS } from '@/data/mockData';
import { normalizeSeatGeekEvents } from '@/lib/adapters';
import { SeatGeekRawEvent } from '@/types/wavii';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');

  const lat = latParam ? parseFloat(latParam) : 39.7684;
  const lon = lonParam ? parseFloat(lonParam) : -86.1581;

  const clientId =
    process.env.SEATGEEK_CLIENT_ID ||
    process.env.NEXT_PUBLIC_SEATGEEK_CLIENT_ID;

  if (!clientId || clientId.trim() === '') {
    return NextResponse.json({
      source: 'mock',
      reason: 'Missing SEATGEEK_CLIENT_ID in .env.local',
      events: MOCK_EVENTS,
    });
  }

  try {
    const url = new URL('https://api.seatgeek.com/2/events');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('range', '50mi');
    url.searchParams.set('per_page', '40');
    url.searchParams.set('sort', 'score.desc');
    url.searchParams.set('client_id', clientId.trim());

    const res = await fetch(url.toString(), {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`SeatGeek API responded with status ${res.status}`);
    }

    const data = (await res.json()) as { events?: SeatGeekRawEvent[] };
    if (!data.events || data.events.length === 0) {
      return NextResponse.json({
        source: 'mock',
        reason: 'SeatGeek returned 0 events for coordinates',
        events: MOCK_EVENTS,
      });
    }

    const normalized = normalizeSeatGeekEvents(data.events, lat, lon);
    return NextResponse.json({
      source: 'live',
      events: normalized,
    });
  } catch (err) {
    return NextResponse.json({
      source: 'mock',
      reason: err instanceof Error ? err.message : 'Unknown error',
      events: MOCK_EVENTS,
    });
  }
}