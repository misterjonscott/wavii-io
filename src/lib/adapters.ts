import {
  DailyWeatherAndDensity,
  EventTaxonomy,
  OpenMeteoRawDaily,
  OpenMeteoRawAirQuality,
  SeatGeekRawEvent,
  WaviiEvent,
} from '@/types/wavii';

const ALL_CAPS_ACRONYMS = [
  'nba',
  'ncaa',
  'nfl',
  'mlb',
  'nhl',
  'mls',
  'wnba',
  'ufc',
  'wwe',
  'pga',
  'lpga',
  'nascar',
  'f1',
  'atp',
  'wta',
  'edm',
  'dj',
];

const SPECIAL_CASES: Record<string, string> = {
  rnb: 'RnB',
};

export function formatTag(t: string): string {
  if (!t) return '';
  return t
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (SPECIAL_CASES[lower]) {
        return SPECIAL_CASES[lower];
      }
      if (ALL_CAPS_ACRONYMS.includes(lower)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

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
  family: [
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
  liveEvents: WaviiEvent[],
  rawAirQuality?: OpenMeteoRawAirQuality
): DailyWeatherAndDensity[] {
  const {
    time,
    weather_code,
    temperature_2m_max,
    temperature_2m_min,
    precipitation_probability_max,
    sunset,
  } = rawWeather.daily;

  return time.slice(0, 7).map((dateIso, idx) => {
    const [year, month, dayNum] = dateIso.split('-').map(Number);
    const localDate = new Date(year, month - 1, dayNum);
    const dayOfWeekIdx = localDate.getDay();
    const sDay = SHORT_DAYS[dayOfWeekIdx].toLowerCase();

    const dayEvents = liveEvents.filter((evt) => {
      const lowerDate = evt.formattedDate.toLowerCase();
      const evtDateIso = evt.datetimeLocal.split('T')[0];
      return lowerDate.startsWith(sDay) || evtDateIso === dateIso;
    });

    const concerts = dayEvents.filter((e) => e.taxonomy === 'concert').length;
    const family = dayEvents.filter((e) => e.taxonomy === 'family').length;
    const theater = dayEvents.filter((e) => e.taxonomy === 'theater').length;
    const sports = dayEvents.filter((e) => e.taxonomy === 'sports').length;

    let aqi = 42;
    if (rawAirQuality?.hourly?.time && rawAirQuality?.hourly?.us_aqi) {
      const dayHours = rawAirQuality.hourly.time
        .map((t, i) => ({ t, aqi: rawAirQuality.hourly.us_aqi[i] }))
        .filter((item) => item.t.startsWith(dateIso) && item.aqi != null);
      if (dayHours.length > 0) {
        const sum = dayHours.reduce((acc, h) => acc + h.aqi, 0);
        aqi = Math.round(sum / dayHours.length);
      }
    }

    const sunsetTime = sunset?.[idx] || `${dateIso}T17:30:00`;

    return {
      dateIso,
      day: DAY_NAMES[dayOfWeekIdx],
      shortDay: SHORT_DAYS[dayOfWeekIdx],
      weatherCode: mapWmoCodeToWeatherIcon(weather_code[idx] ?? 0),
      highTemp: Math.round(temperature_2m_max[idx] ?? 75),
      lowTemp: Math.round(temperature_2m_min[idx] ?? 55),
      precipChance: Math.round(precipitation_probability_max[idx] ?? 10),
      concerts: concerts > 0 ? concerts : 2,
      family: family > 0 ? family : 1,
      theater: theater > 0 ? theater : 1,
      sports: sports > 0 ? sports : 1,
      aqi,
      sunsetTime,
    };
  });
}

export interface EnvironmentalBadgeInfo {
  label: string;
  type: 'aqi' | 'sunset';
  colorClass: string;
}

export function getEnvironmentalTags(
  event: WaviiEvent,
  weatherDensity: DailyWeatherAndDensity[]
): EnvironmentalBadgeInfo[] {
  const badges: EnvironmentalBadgeInfo[] = [];
  const eventDateIso = event.datetimeLocal.split('T')[0];
  const matchedDay =
    weatherDensity.find((d) => d.dateIso === eventDateIso) || weatherDensity[0];

  if (matchedDay && matchedDay.aqi !== undefined) {
    const aqi = matchedDay.aqi;
    let colorClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (aqi >= 50 && aqi < 100) {
      colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    } else if (aqi >= 100) {
      colorClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
    badges.push({
      label: `🍃 AQI: ${aqi}`,
      type: 'aqi',
      colorClass,
    });
  }

  if (matchedDay && matchedDay.sunsetTime) {
    const sunsetMs = new Date(matchedDay.sunsetTime).getTime();
    const eventMs = new Date(event.datetimeLocal).getTime();
    const diffMinutes = Math.abs(eventMs - sunsetMs) / (1000 * 60);
    if (diffMinutes <= 45) {
      badges.push({
        label: '🌅 Golden Hour Start',
        type: 'sunset',
        colorClass: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
      });
    }
  }

  return badges;
}

function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
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
  if (combined.includes('family')) return 'family';
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
  rawEvents: SeatGeekRawEvent[],
  originLat: number = 39.7684,
  originLon: number = -86.1581
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

    const rawGenre = formatTag(
      primaryPerformer?.genres?.[0]?.name ||
      raw.type
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    );
    const categoryLabel = formatTag(taxonomy.charAt(0).toUpperCase() + taxonomy.slice(1));

    const tags = Array.from(new Set([rawGenre, categoryLabel])).map(formatTag);

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
      source: 'seatgeek',
      ticketingOptions: [{ source: 'seatgeek', url: raw.url || 'https://seatgeek.com' }],
      lat,
      lon,
      estimatedPrice,
      distanceMiles: calculateDistanceMiles(originLat, originLon, lat, lon),
      popularityScore,
      isHotThree: idx < 3,
    };
  });
}
