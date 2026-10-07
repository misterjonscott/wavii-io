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
      dateTime: string;
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
  }>;
  priceRanges? : Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  popularity? : number; // Not directly available, can be derived or set to a default
}

function mapTicketmasterTaxonomy(
  classifications? : Array<{ segment? : { name: string }; genre? : { name: string } }>,
): EventTaxonomy {
  if (!classifications || classifications.length === 0) return 'concert';

  const combined = classifications
    .map((c) => `${c.segment?.name || ''} ${c.genre?.name || ''}`)
    .join(' ')
    .toLowerCase();

  if (combined.includes('family')) return 'family';
  if (combined.includes('theater') || combined.includes('broadway')) return 'theater';
  if (combined.includes('sports')) return 'sports';
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

    const taxonomy = mapTicketmasterTaxonomy(raw.classifications || attraction?.classifications);
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
      id: parseInt(raw.id) || idx, // Convert string ID to number, or use index as fallback
      title: raw.name || 'Untitled Event',
      venueName: venue?.name || 'Unknown Venue',
      cityState: `${venue?.city?.name || 'Unknown City'}${
        venue?.state?.stateCode ? `, ${venue.state.stateCode}` : ''
      }`,
      datetimeLocal: raw.dates?.start?.dateTime || '',
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
