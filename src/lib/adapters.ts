import {
  DailyWeatherAndDensity,
  EventTaxonomy,
  OpenMeteoRawDaily,
  SeatGeekRawEvent,
  WaviiEvent,
} from '@/types/wavii';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Curated, taxonomy-specific fallback pools so events without SeatGeek photos never look identical
const FALLBACK_IMAGES: Record<EventTaxonomy, string[]> = {
  concert: [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=600&q=80',
  ],
  comedy: [
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=600&q=80',
  ],
  theater: [
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1513829596324-4bb2800c5efb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=600&q=80',
  ],
  sports: [
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
  ],
};

export function mapWmoCodeToWeatherIcon(
  code: number
): DailyWeatherAndDensity['weatherCode'] {
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 85 && code <= 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) {
    return 'rain';
  }
  if (code >= 1 && code <= 48) return 'cloud';
  return 'sun';
}

export function mergeLiveWeatherWithDensity(
  rawWeather: OpenMeteoRawDaily,
  existingDensity: DailyWeatherAndDensity[]
): DailyWeatherAndDensity[] {
  const {
    time,
    weather_code,
    temperature_2m_max,
    temperature_2m_min,
    precipitation_probability_max,
  } = rawWeather.daily;

  return time.slice(0, 7).map((dateIso, idx) => {
    const [year, month, dayNum] = dateIso.split('-').map(Number);
    const localDate = new Date(year, month - 1, dayNum);
    const dayOfWeekIdx = localDate.getDay();
    const fallback = existingDensity[idx] || existingDensity[0];

    return {
      dateIso,
      day: DAY_NAMES[dayOfWeekIdx],
      shortDay: SHORT_DAYS[dayOfWeekIdx],
      weatherCode: mapWmoCodeToWeatherIcon(weather_code[idx] ?? 0),
      highTemp: Math.round(temperature_2m_max[idx] ?? fallback.highTemp),
      lowTemp: Math.round(temperature_2m_min[idx] ?? fallback.lowTemp),
      precipChance: Math.round(
        precipitation_probability_max[idx] ?? fallback.precipChance
      ),
      concerts: fallback.concerts,
      comedy: fallback.comedy,
      theater: fallback.theater,
      sports: fallback.sports,
    };
  });
}

function calculateMilesFromIndy(lat: number, lon: number): number {
  const INDY_LAT = 39.7684;
  const INDY_LON = -86.1581;
  const R = 3958.8;
  const dLat = ((lat - INDY_LAT) * Math.PI) / 180;
  const dLon = ((lon - INDY_LON) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((INDY_LAT * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function mapSeatGeekTaxonomy(
  rawType: string,
  taxonomies: Array<{ name: string }>
): EventTaxonomy {
  const combined = `${rawType} ${taxonomies
    .map((t) => t.name)
    .join(' ')}`.toLowerCase();
  if (combined.includes('comedy')) return 'comedy';
  if (
    combined.includes('theater') ||
    combined.includes('broadway') ||
    combined.includes('classical') ||
    combined.includes('orchestral') ||
    combined.includes('family')
  ) {
    return 'theater';
  }
  if (
    combined.includes('sports') ||
    combined.includes('basketball') ||
    combined.includes('hockey') ||
    combined.includes('football') ||
    combined.includes('baseball') ||
    combined.includes('auto_racing') ||
    combined.includes('wrestling') ||
    combined.includes(' soccer') ||
    combined.includes('minor_league')
  ) {
    return 'sports';
  }
  return 'concert';
}

export function normalizeSeatGeekEvents(
  rawEvents: SeatGeekRawEvent[]
): WaviiEvent[] {
  const usedImageUrls = new Set<string>();

  return rawEvents.map((raw, idx) => {
    const taxonomy = mapSeatGeekTaxonomy(raw.type, raw.taxonomies || []);
    const dt = new Date(raw.datetime_local);

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

    // Search all performers for a valid, non-duplicate image first
    const performerWithImage = raw.performers?.find(
      (p) => p.image && !usedImageUrls.has(p.image)
    ) || raw.performers?.find((p) => Boolean(p.image));

    const primaryPerformer = performerWithImage || raw.performers?.[0];
    const pool = FALLBACK_IMAGES[taxonomy];
    const fallbackUrl = pool[(raw.id + idx) % pool.length];

    let resolvedImage = primaryPerformer?.image || fallbackUrl;
    if (usedImageUrls.has(resolvedImage)) {
      resolvedImage = pool[idx % pool.length];
    }
    usedImageUrls.add(resolvedImage);

    const rawGenre =
      primaryPerformer?.genres?.[0]?.name ||
      raw.type
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    const categoryLabel = taxonomy.charAt(0).toUpperCase() + taxonomy.slice(1);

    const tags = Array.from(new Set([rawGenre, categoryLabel]));

    const popularityScore = Math.max(
      65,
      Math.min(99, Math.round((raw.score || raw.popularity || 0.78) * 100))
    );

    const estimatedPrice =
      raw.stats?.lowest_price && raw.stats.lowest_price > 0
        ? Math.round(raw.stats.lowest_price)
        : Math.round(popularityScore * 0.65);

    const lat = raw.venue?.location?.lat || 39.7684;
    const lon = raw.venue?.location?.lon || -86.1581;

    return {
      id: raw.id,
      title: raw.short_title || raw.title,
      venueName: raw.venue?.name || 'Indianapolis Venue',
      cityState: raw.venue?.display_location || 'Indianapolis, IN',
      datetimeLocal: raw.datetime_local,
      formattedDate,
      taxonomy,
      tags,
      imageUrl: resolvedImage,
      imageAttribution: primaryPerformer?.image_rights_message || null,
      seatgeekUrl: raw.url || 'https://seatgeek.com',
      lat,
      lon,
      estimatedPrice,
      distanceMiles: calculateMilesFromIndy(lat, lon),
      popularityScore,
      isHotThree: idx < 3,
    };
  });
}