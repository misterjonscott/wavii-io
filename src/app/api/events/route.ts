import { NextRequest, NextResponse } from 'next/server';
import { MOCK_EVENTS } from '@/data/mockData';
import { normalizeSeatGeekEvents } from '@/lib/adapters';
import { normalizeTicketmasterEvents } from '@/lib/ticketmaster';
import { mergeEvents } from '@/lib/deduplicator';
import { SeatGeekRawEvent, WaviiEvent, TicketmasterRawEvent } from '@/types/wavii';

export async function GET(request: NextRequest) {
  let ticketmasterHttpStatus: number | null = null;
  let seatGeekHttpStatus: number | null = null;
  let ticketmasterErrorCount = 0;
  let seatGeekErrorCount = 0;
  let ticketmasterSuccessCount = 0;
  let seatGeekSuccessCount = 0;
  let totalRawTicketmasterItems = 0;
  let totalRawSeatGeekItems = 0;
  let rawSeatGeekPayload: unknown = {};
  let rawTicketmasterPayload: unknown = {};
  const searchParams = request.nextUrl.searchParams;
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');
  const categoryParam = searchParams.get('category');

  const lat = latParam ? parseFloat(latParam) : 39.7684;
  const lon = lonParam ? parseFloat(lonParam) : -86.1581;

  const seatGeekClientId =
    process.env.SEATGEEK_CLIENT_ID ||
    process.env.NEXT_PUBLIC_SEATGEEK_CLIENT_ID;
  const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;

  const seatGeekPromise = (async () => {
    if (!seatGeekClientId || seatGeekClientId.trim() === '') {
      throw new Error('Missing SEATGEEK_CLIENT_ID in .env.local');
    }
    const url = new URL('https://api.seatgeek.com/2/events');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('range', '50mi');
    url.searchParams.set('per_page', '100');
    url.searchParams.set('sort', 'score.desc');
    url.searchParams.set('client_id', seatGeekClientId.trim());

    try {
      const res = await fetch(url.toString(), { cache: 'no-store' });
      seatGeekHttpStatus = res.status;
      if (!res.ok) {
        seatGeekErrorCount++;
        throw new Error(`SeatGeek API responded with status ${res.status}`);
      } else {
        seatGeekSuccessCount++;
      }
      const text = await res.text();
      let data: { events?: SeatGeekRawEvent[] } = {};
      try {
        data = text ? JSON.parse(text) : {};
        rawSeatGeekPayload = data;
      } catch (parseError) {
        console.error('Failed to parse SeatGeek JSON:', parseError);
        console.log('Raw text:', text);
        rawSeatGeekPayload = { parseError: true, text };
      }
      totalRawSeatGeekItems = data.events?.length || 0;
      return normalizeSeatGeekEvents(data.events || [], lat, lon);
    } catch (err) {
      console.error('SeatGeek Fetch Exception:', err);
      rawSeatGeekPayload = { error: err instanceof Error ? err.message : 'Unknown error' };
      throw err;
    }
  })();

  const ticketmasterPromise = (async () => {
    if (!ticketmasterApiKey || ticketmasterApiKey.trim() === '') {
      throw new Error('Missing TICKETMASTER_API_KEY in .env.local');
    }
    const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
    url.searchParams.set('apikey', ticketmasterApiKey.trim());
    url.searchParams.set('latlong', `${lat},${lon}`);
    url.searchParams.set('radius', '50'); // Ticketmaster uses miles by default
    url.searchParams.set('size', '100');

    if (categoryParam) {
      let classificationName: string | undefined;
      switch (categoryParam.toLowerCase()) {
        case 'family':
          classificationName = 'Family';
          break;
        case 'sports':
          classificationName = 'Sports';
          break;
        case 'music':
        case 'concerts':
          classificationName = 'Music';
          break;
      }
      if (classificationName) {
        url.searchParams.set('classificationName', classificationName);
      }
    }

    try {
      const res = await fetch(url.toString(), { cache: 'no-store' });
      ticketmasterHttpStatus = res.status;
      if (!res.ok) {
        ticketmasterErrorCount++;
        throw new Error(`Ticketmaster API responded with status ${res.status}`);
      } else {
        ticketmasterSuccessCount++;
      }
      const data = (await res.json()) as { _embedded?: { events?: TicketmasterRawEvent[] } };
      rawTicketmasterPayload = data;
      totalRawTicketmasterItems = data._embedded?.events?.length || 0;
      return normalizeTicketmasterEvents(data._embedded?.events || []);
    } catch (err) {
      console.error('Ticketmaster Fetch Exception:', err);
      rawTicketmasterPayload = { error: err instanceof Error ? err.message : 'Unknown error' };
      throw err;
    }
  })();

  const [seatGeekResult, ticketmasterResult] = await Promise.allSettled([
    seatGeekPromise,
    ticketmasterPromise,
  ]);

  const allEvents: WaviiEvent[] = [];

  if (ticketmasterResult.status === 'fulfilled') {
    allEvents.push(...ticketmasterResult.value);
  } else {
    console.error('Ticketmaster fetch failed:', ticketmasterResult.reason);
  }

  if (seatGeekResult.status === 'fulfilled') {
    allEvents.push(...seatGeekResult.value);
  } else {
    console.error('SeatGeek fetch failed:', seatGeekResult.reason);
  }

  if (allEvents.length === 0) {
    return NextResponse.json({
      source: 'mock',
      reason: 'Both APIs failed or returned no events',
      events: MOCK_EVENTS,
    });
  }

  const deduplicatedEvents = mergeEvents(allEvents);

  deduplicatedEvents.sort((a, b) => {
    const dateA = new Date(a.datetimeLocal).getTime();
    const dateB = new Date(b.datetimeLocal).getTime();
    return dateA - dateB;
  });

  return NextResponse.json({
    source: allEvents.length > 0 ? 'mixed' : 'mock',
    events: deduplicatedEvents,
    metadata: {
      totalRawTicketmasterItems,
      totalRawSeatGeekItems,
      ticketmasterHttpStatus,
      seatGeekHttpStatus,
      ticketmasterErrorCount,
      seatGeekErrorCount,
      ticketmasterSuccessCount,
      seatGeekSuccessCount,
      rawSeatGeekPayload,
      rawTicketmasterPayload,
    },
  });
}