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

/**
 * Maps WMO Weather interpretation codes from Open-Meteo to Wavii's icon tokens
 */
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

/**
 * Merges live Open-Meteo 7-day forecast arrays with event taxonomy density
 */
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

/**
 * Haversine formula to compute distance in miles from Downtown Indianapolis
 */
function calculateMilesFromIndy(lat: number, lon: number): number {
  const INDY_LAT = 39.7684;
  const INDY_LON = -86.1581;
  const R = 3958.8; // Earth radius in miles
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

function mapSeatGeekTaxonomy(rawType: string, taxonomies: Array<{ name: string }>): EventTaxonomy {
  const combined = `${rawType} ${taxonomies.map((t) => t.name).join(' ')}`.toLowerCase();
  if (combined.includes('comedy')) return 'comedy';
  if (combined.includes('theater') || combined.includes('broadway') || combined.includes('classical')) {
    return 'theater';
  }
  if (combined.includes('sports') || combined.includes('basketball') || combined.includes('hockey') || combined.includes('football') || combined.includes('baseball')) {
    return 'sports';
  }
  return 'concert';
}

/**
 * Normalizes raw SeatGeek API v2 events into strict WaviiEvent models
 */
export function normalizeSeatGeekEvents(rawEvents: SeatGeekRawEvent[]): WaviiEvent[] {
  return rawEvents.map((raw, idx) => {
    const primaryPerformer = raw.performers?.[0];
    const taxonomy = mapSeatGeekTaxonomy(raw.type, raw.taxonomies || []);
    const dt = new Date(raw.datetime_local);

    const formattedDate = dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }) + ' • ' + dt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    const genreTag = primaryPerformer?.genres?.[0]?.name || raw.type.replace('_', ' ');
    const categoryLabel = taxonomy.charAt(0).toUpperCase() + taxonomy.slice(1);
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
      tags: [genreTag, categoryLabel],
      imageUrl:
        primaryPerformer?.image ||
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
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
