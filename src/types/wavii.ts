export type EventTaxonomy = 'concert' | 'family' | 'theater' | 'sports';
export type ViewMode = 'map' | 'list';
export type SortField =
  | 'title'
  | 'venue'
  | 'city'
  | 'date'
  | 'price'
  | 'distance'
  | 'popularity';
export type SortOrder = 'asc' | 'desc';

/**
 * Raw SeatGeek API v2 Payload Subset
 * Demonstrates we know how to type external third-party payloads safely
 */
export interface SeatGeekRawEvent {
  id: number;
  title: string;
  short_title: string;
  datetime_local: string;
  url: string;
  type: string;
  score: number;
  popularity: number;
  stats: {
    lowest_price?: number | null;
    highest_price?: number | null;
    event_count?: number;
  };
  venue: {
    id: number;
    name: string;
    city: string;
    state: string;
    display_location: string;
    location: {
      lat: number;
      lon: number;
    };
  };
  performers: Array<{
    id: number;
    name: string;
    image: string;
    image_license?: string;
    image_rights_message?: string | null;
    genres?: Array<{
      id: number;
      name: string;
      slug: string;
    }>;
  }>;
  taxonomies: Array<{
    id: number;
    name: string;
  }>;
}

/**
 * Raw Open-Meteo 7-Day Forecast Payload
 */
export interface OpenMeteoRawDaily {
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunset?: string[];
  };
}

export interface OpenMeteoRawAirQuality {
  hourly: {
    time: string[];
    us_aqi: number[];
  };
}

/**
 * Normalized UI Event Model consumed by Wavii components
 */
export interface WaviiEvent {
  id: number;
  title: string;
  venueName: string;
  cityState: string;
  datetimeLocal: string;
  formattedDate: string;
  taxonomy: EventTaxonomy;
  tags: string[];
  imageUrl: string;
  imageAttribution?: string | null;
  seatgeekUrl: string;
  lat: number;
  lon: number;
  estimatedPrice: number; // Derived from stats.lowest_price or popularity score fallback
  distanceMiles: number;  // Calculated relative to search center (default: Indianapolis)
  popularityScore: number;
  isHotThree?: boolean;
}

export interface DailyWeatherAndDensity {
  dateIso: string;
  day: string;
  shortDay: string;
  weatherCode: 'sun' | 'cloud' | 'rain' | 'snow';
  highTemp: number;
  lowTemp: number;
  precipChance: number;
  concerts: number;
  family: number;
  theater: number;
  sports: number;
  aqi?: number;
  sunsetTime?: string;
}