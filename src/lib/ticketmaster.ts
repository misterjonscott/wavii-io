import {
  WaviiEvent,
  EventTaxonomy,
} from '@/types/wavii';
import { formatTag } from './adapters'; // Assuming formatTag is exported from adapters.ts

// Define a subset of the raw Ticketmaster API v2 Event payload
export interface TicketmasterRawEvent {
  id: string;
  name: string;
  url: string;
  dates: {
    start: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
    };
  };
  _embedded? : {
    events?: TicketmasterRawEvent[]; // Self-referencing for the HAL structure
    venues? : Array<{
      name: string;
      city: {
        name: string;
      };
      state? : {
        name: string;
        stateCode: string;
      };
      address? : {
        line1: string;
      };
      location: {
        latitude: string;
        longitude: string;
      };
    }>;
    attractions? : Array<{
      name: string;
      images? : Array<{
        url: string;
        ratio: string; // e.g., "16_9", "3_2"
      }>;
      classifications? : Array<{
        segment? : {
          name: string;
        };
        genre? : {
          name: string;
        };
        subGenre?: {
          name: string;
        };
        type?: {
          name: string;
        };
        subType?: {
          name: string;
        };
      }>;
    }>;
  };
  images? : Array<{
    url: string;
    ratio: string; // e.g., "16_9", "3_2"
  }>;
  classifications? : Array<{
    segment? : {
      name: string;
    };
    genre? : {
      name: string;
    };
    subGenre?: {
      name: string;
    };
    type?: {
      name: string;
    };
    subType?: {
      name: string;
    };  }>;
  priceRanges? : Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  popularity? : number; // Not directly available, can be derived or set to a default
}

function mapTicketmasterTaxonomy(
  classifications? : Array<{
    segment? : { name: string };
    genre? : { name: string };
    subGenre?: { name: string };
    type?: { name: string };
    subType?: { name: string };
  }>,
  eventTitle: string,
): EventTaxonomy {
  if (!classifications || classifications.length === 0) {
    const titleLower = eventTitle.toLowerCase();
    if (['family', 'children', 'circus', 'magic', 'ice shows', 'disney', 'monster jam', 'globetrotters', 'paw patrol', 'kidz bop'].some(keyword => titleLower.includes(keyword))) return 'family';
    if (['theater', 'theatre', 'broadway', 'musical', 'opera', 'ballet', 'dance', 'comedy'].some(keyword => titleLower.includes(keyword))) return 'theater';
    if (['sports', 'basketball', 'football', 'baseball', 'hockey', 'soccer', 'wrestling', 'motorsports', 'rodeo'].some(keyword => titleLower.includes(keyword))) return 'sports';
    return 'concert';
  }

  const combined = classifications
    .map((c) =>
      `${c.segment?.name || ''} ${c.genre?.name || ''} ${c.subGenre?.name || ''} ${c.type?.name || ''} ${c.subType?.name || ''}`,
    )
    .join(' ')
    .toLowerCase();

  const searchString = `${combined} ${eventTitle.toLowerCase()}`;

  if (['family', 'children', 'circus', 'magic', 'ice shows', 'disney', 'monster jam', 'globetrotters', 'paw patrol', 'kidz bop'].some(keyword => searchString.includes(keyword))) return 'family';
  if (['theater', 'theatre', 'broadway', 'musical', 'opera', 'ballet', 'dance', 'comedy'].some(keyword => searchString.includes(keyword))) return 'theater';
  if (['sports', 'basketball', 'football', 'baseball', 'hockey', 'soccer', 'wrestling', 'motorsports', 'rodeo'].some(keyword => searchString.includes(keyword))) return 'sports';
  return 'concert';
}

export function normalizeTicketmasterEvents(
  rawEvents: TicketmasterRawEvent[],
): WaviiEvent[] {
  return rawEvents.map((raw, idx) => {
    const venue = raw._embedded?.venues?.[0];
    const attraction = raw._embedded?.attractions?.[0];

    // Prefer 16_9 image ratio
    const primaryImage =
      raw.images?.find((img) => img.ratio === '16_9') ||
      attraction?.images?.find((img) => img.ratio === '16_9') ||
      raw.images?.[0] ||
      attraction?.images?.[0];

    const taxonomy = mapTicketmasterTaxonomy(raw.classifications || attraction?.classifications, raw.name);
    const dt = new Date(raw.dates?.start?.dateTime || '');

    const formattedDate =
      dt.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }) +
      ' • ' +
      dt.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

    const rawGenre = formatTag(
      raw.classifications?.[0]?.genre?.name ||
      attraction?.classifications?.[0]?.genre?.name ||
      taxonomy
    );
    const categoryLabel = formatTag(taxonomy.charAt(0).toUpperCase() + taxonomy.slice(1));
    const tags = Array.from(new Set([rawGenre, categoryLabel])).map(formatTag);

    const lat = parseFloat(venue?.location?.latitude || '0');
    const lon = parseFloat(venue?.location?.longitude || '0');

    // Estimate price and popularity since Ticketmaster's raw data might differ
    const estimatedPrice = raw.priceRanges?.[0]?.min
      ? Math.round(raw.priceRanges[0].min)
      : 50; // Default or derived
    const popularityScore = raw.popularity ? Math.round(raw.popularity * 100) : 75; // Default or derived

    return {
      id: Math.abs(raw.id.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)) || (100000 + idx),
      title: raw.name || 'Untitled Event',
      venueName: venue?.name || 'Unknown Venue',
      cityState: `${venue?.city?.name || 'Unknown City'}${
        venue?.state?.stateCode ? `, ${venue.state.stateCode}` : ''
      }`,
      datetimeLocal: raw.dates?.start?.localDate
        ? `${raw.dates.start.localDate}T${raw.dates.start.localTime || '19:00:00'}`
        : raw.dates?.start?.dateTime || '',
      formattedDate,
      taxonomy,
      tags,
      imageUrl: primaryImage?.url || '', // Fallback or a default image
      imageAttribution: null, // Ticketmaster API doesn't usually provide attribution directly
      seatgeekUrl: raw.url || 'https://www.ticketmaster.com',
      source: 'ticketmaster',
      ticketingOptions: [{ source: 'ticketmaster', url: raw.url || '' }],
      lat,
      lon,
      estimatedPrice,
      distanceMiles: 0, // Will be calculated dynamically in the UI
      popularityScore,
      isHotThree: false, // This is specific to SeatGeek or a UI logic
    };
  });
}
