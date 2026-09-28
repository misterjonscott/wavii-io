import { NextResponse } from 'next/server';
import { MOCK_EVENTS } from '@/data/mockData';
import { normalizeSeatGeekEvents } from '@/lib/adapters';
import { SeatGeekRawEvent } from '@/types/wavii';

export async function GET() {
  const clientId = process.env.SEATGEEK_CLIENT_ID;

  // Graceful fallback if cloning repo without a SeatGeek API key
  if (!clientId) {
    return NextResponse.json({
      source: 'mock',
      events: MOCK_EVENTS,
    });
  }

  try {
    const url = new URL('https://api.seatgeek.com/2/events');
    url.searchParams.set('lat', '39.7684');
    url.searchParams.set('lon', '-86.1581');
    url.searchParams.set('range', '35mi');
    url.searchParams.set('per_page', '20');
    url.searchParams.set('sort', 'score.desc');
    url.searchParams.set('client_id', clientId);

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      throw new Error(`SeatGeek responded with ${res.status}`);
    }

    const data = (await res.json()) as { events?: SeatGeekRawEvent[] };
    if (!data.events || data.events.length === 0) {
      return NextResponse.json({
        source: 'mock',
        events: MOCK_EVENTS,
      });
    }

    const normalized = normalizeSeatGeekEvents(data.events);
    return NextResponse.json({
      source: 'live',
      events: normalized,
    });
  } catch {
    return NextResponse.json({
      source: 'mock',
      events: MOCK_EVENTS,
    });
  }
}
