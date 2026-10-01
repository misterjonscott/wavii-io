import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  WaviiEvent,
  DailyWeatherAndDensity,
  EventTaxonomy,
  ViewMode,
  SortField,
  SortOrder,
  OpenMeteoRawDaily,
  OpenMeteoRawAirQuality,
} from '@/types/wavii';
import { MOCK_EVENTS, MOCK_WEATHER_DENSITY } from '@/data/mockData';
import { mergeLiveWeatherWithDensity } from '@/lib/adapters';

export type NavTab = 'explore' | 'saved';

interface WaviiState {
  events: WaviiEvent[];
  weatherDensity: DailyWeatherAndDensity[];
  weatherSource: 'mock' | 'live';
  eventSource: 'mock' | 'live';
  isHydrating: boolean;
  originLat: number;
  originLon: number;
  detectedCity: string;

  // Navigation & Saved State
  activeNavTab: NavTab;
  savedEventIds: number[];
  isFilterMenuOpen: boolean;
  drawerMode: 'hot-three' | 'detail';
  spiderfiedCluster: { clusterId: number; leaves: WaviiEvent[]; coordinates: [number, number] } | null;

  // Filter Facets (All rendered as removable tokens when active)
  viewMode: ViewMode;
  searchQuery: string;
  maxPrice: string;
  distanceMiles: number;
  selectedCategory: 'all' | EventTaxonomy;
  selectedDay: string | null;
  selectedTags: string[];
  selectedCities: string[];
  onlyDryNights: boolean;
  minHypeScore: number;
  selectedEventId: number;
  sortField: SortField;
  sortOrder: SortOrder;

  // Actions
  setActiveNavTab: (tab: NavTab) => void;
  toggleSaveEvent: (id: number) => void;
  setIsFilterMenuOpen: (open: boolean) => void;
  setDrawerMode: (mode: 'hot-three' | 'detail') => void;
  setSpiderfiedCluster: (cluster: { clusterId: number; leaves: WaviiEvent[]; coordinates: [number, number] } | null) => void;
  clearSpiderfiedCluster: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setMaxPrice: (price: string) => void;
  setDistanceMiles: (miles: number) => void;
  setSelectedCategory: (category: 'all' | EventTaxonomy) => void;
  toggleCategoryShortcut: (category: EventTaxonomy) => void;
  toggleSelectedDay: (day: string) => void;
  toggleTagToken: (tag: string) => void;
  toggleCityToken: (city: string) => void;
  toggleOnlyDryNights: () => void;
  toggleMinHypeScore: () => void;
  setSelectedEventId: (id: number) => void;
  setSorting: (field: SortField) => void;
  resetFilters: () => void;
  hydrateLiveData: () => Promise<void>;
}

export const BLANK_WEATHER_DENSITY: DailyWeatherAndDensity[] = [
  { dateIso: '2026-12-27', day: 'Sunday', shortDay: 'Sun', weatherCode: 'sun', highTemp: 75, lowTemp: 55, precipChance: 0, concerts: 0, comedy: 0, theater: 0, sports: 0, aqi: 42, sunsetTime: '2026-12-27T17:25:00' },
  { dateIso: '2026-12-28', day: 'Monday', shortDay: 'Mon', weatherCode: 'sun', highTemp: 75, lowTemp: 55, precipChance: 0, concerts: 0, comedy: 0, theater: 0, sports: 0, aqi: 35, sunsetTime: '2026-12-28T17:26:00' },
  { dateIso: '2026-12-29', day: 'Tuesday', shortDay: 'Tue', weatherCode: 'sun', highTemp: 75, lowTemp: 55, precipChance: 0, concerts: 0, comedy: 0, theater: 0, sports: 0, aqi: 48, sunsetTime: '2026-12-29T17:27:00' },
  { dateIso: '2026-12-30', day: 'Wednesday', shortDay: 'Wed', weatherCode: 'sun', highTemp: 75, lowTemp: 55, precipChance: 0, concerts: 0, comedy: 0, theater: 0, sports: 0, aqi: 52, sunsetTime: '2026-12-30T17:28:00' },
  { dateIso: '2026-12-31', day: 'Thursday', shortDay: 'Thu', weatherCode: 'sun', highTemp: 75, lowTemp: 55, precipChance: 0, concerts: 0, comedy: 0, theater: 0, sports: 0, aqi: 41, sunsetTime: '2026-12-31T17:29:00' },
  { dateIso: '2027-01-01', day: 'Friday', shortDay: 'Fri', weatherCode: 'sun', highTemp: 75, lowTemp: 55, precipChance: 0, concerts: 0, comedy: 0, theater: 0, sports: 0, aqi: 39, sunsetTime: '2027-01-01T17:30:00' },
  { dateIso: '2027-01-02', day: 'Saturday', shortDay: 'Sat', weatherCode: 'sun', highTemp: 75, lowTemp: 55, precipChance: 0, concerts: 0, comedy: 0, theater: 0, sports: 0, aqi: 45, sunsetTime: '2027-01-02T17:31:00' },
];

export const useWaviiStore = create<WaviiState>()(
  persist(
    (set, get) => ({
      events: [],
      weatherDensity: BLANK_WEATHER_DENSITY,
      weatherSource: 'mock',
      eventSource: 'mock',
      isHydrating: false,
      originLat: 39.7684,
      originLon: -86.1581,
      detectedCity: 'Indianapolis, IN',

      activeNavTab: 'explore',
      savedEventIds: [],
      isFilterMenuOpen: false,
      drawerMode: 'hot-three',
      spiderfiedCluster: null,

      viewMode: 'map',
      searchQuery: '',
      maxPrice: '',
      distanceMiles: 50,
      selectedCategory: 'all',
      selectedDay: null,
      selectedTags: [],
      selectedCities: [],
      onlyDryNights: false,
      minHypeScore: 0,
      selectedEventId: MOCK_EVENTS[0].id,
      sortField: 'popularity',
      sortOrder: 'desc',

      setActiveNavTab: (tab) => set({ activeNavTab: tab }),

      toggleSaveEvent: (id) =>
        set((state) => ({
          savedEventIds: state.savedEventIds.includes(id)
            ? state.savedEventIds.filter((item) => item !== id)
            : [...state.savedEventIds, id],
        })),

      setIsFilterMenuOpen: (isFilterMenuOpen) => set({ isFilterMenuOpen }),
      setDrawerMode: (drawerMode) => set({ drawerMode }),
      setSpiderfiedCluster: (spiderfiedCluster) => set({ spiderfiedCluster }),
      clearSpiderfiedCluster: () => set({ spiderfiedCluster: null }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setMaxPrice: (maxPrice) => set({ maxPrice }),
      setDistanceMiles: (distanceMiles) => set({ distanceMiles }),
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

      toggleCategoryShortcut: (category) =>
        set((state) => ({
          selectedCategory:
            state.selectedCategory === category ? 'all' : category,
        })),

      toggleSelectedDay: (day) =>
        set((state) => ({
          selectedDay: state.selectedDay === day ? null : day,
        })),

      toggleTagToken: (tag) =>
        set((state) => ({
          selectedTags: state.selectedTags.includes(tag)
            ? state.selectedTags.filter((t) => t !== tag)
            : [...state.selectedTags, tag],
        })),

      toggleCityToken: (city) =>
        set((state) => ({
          selectedCities: state.selectedCities.includes(city)
            ? state.selectedCities.filter((c) => c !== city)
            : [...state.selectedCities, city],
        })),

      toggleOnlyDryNights: () =>
        set((state) => ({ onlyDryNights: !state.onlyDryNights })),

      toggleMinHypeScore: () =>
        set((state) => ({
          minHypeScore: state.minHypeScore === 85 ? 0 : 85,
        })),

      setSelectedEventId: (selectedEventId) => set({ selectedEventId }),

      setSorting: (field) =>
        set((state) => ({
          sortField: field,
          sortOrder:
            state.sortField === field && state.sortOrder === 'asc'
              ? 'desc'
              : 'asc',
        })),

      resetFilters: () =>
        set({
          activeNavTab: 'explore',
          searchQuery: '',
          maxPrice: '',
          distanceMiles: 50,
          selectedCategory: 'all',
          selectedDay: null,
          selectedTags: [],
          selectedCities: [],
          onlyDryNights: false,
          minHypeScore: 0,
          sortField: 'popularity',
          sortOrder: 'desc',
        }),

      hydrateLiveData: async () => {
        if (get().isHydrating) return;
        set({ isHydrating: true });

        try {
          let lat = 39.7684;
          let lon = -86.1581;

          try {
            const position = await new Promise<GeolocationPosition>(
              (resolve, reject) => {
                if (!navigator.geolocation) {
                  reject(new Error('Geolocation not supported'));
                  return;
                }
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  timeout: 10000,
                  maximumAge: 60000,
                });
              }
            );
            lat = position.coords.latitude;
            lon = position.coords.longitude;
          } catch {
            lat = 39.7684;
            lon = -86.1581;
          }

          set({ originLat: lat, originLon: lon });

          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunset&temperature_unit=fahrenheit&timezone=auto`;
          const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi`;

          const [weatherRes, aqRes, eventsRes] = await Promise.allSettled([
            fetch(weatherUrl),
            fetch(airQualityUrl),
            fetch(`/api/events?lat=${lat}&lon=${lon}`),
          ]);

          let rawAirQuality: OpenMeteoRawAirQuality | undefined;
          if (aqRes.status === 'fulfilled' && aqRes.value.ok) {
            rawAirQuality = (await aqRes.value.json()) as OpenMeteoRawAirQuality;
          }

          if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
            const rawWeather =
              (await weatherRes.value.json()) as OpenMeteoRawDaily;
            if (rawWeather?.daily?.time) {
              const mergedWeather = mergeLiveWeatherWithDensity(
                rawWeather,
                get().events,
                rawAirQuality
              );
              set({ weatherDensity: mergedWeather, weatherSource: 'live' });
            }
          }

          if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
            const payload = (await eventsRes.value.json()) as {
              source: 'mock' | 'live';
              events: WaviiEvent[];
            };
            if (payload?.events?.length > 0) {
              const topEvents = payload.events.slice(0, 10);
              const cityCounts = new Map<string, number>();
              for (const evt of topEvents) {
                if (evt.cityState) {
                  cityCounts.set(
                    evt.cityState,
                    (cityCounts.get(evt.cityState) || 0) + 1
                  );
                }
              }
              let bestCity = 'Indianapolis, IN';
              let maxCount = 0;
              for (const [city, count] of cityCounts.entries()) {
                if (count > maxCount) {
                  maxCount = count;
                  bestCity = city;
                }
              }

              const mergedWeather = get().weatherSource === 'live'
                ? mergeLiveWeatherWithDensity(
                    { daily: { time: get().weatherDensity.map(d => d.dateIso), weather_code: [], temperature_2m_max: get().weatherDensity.map(d => d.highTemp), temperature_2m_min: get().weatherDensity.map(d => d.lowTemp), precipitation_probability_max: get().weatherDensity.map(d => d.precipChance), sunset: get().weatherDensity.map(d => d.sunsetTime || '') } },
                    payload.events,
                    rawAirQuality
                  )
                : get().weatherDensity;

              set({
                events: payload.events,
                eventSource: payload.source,
                selectedEventId: payload.events[0].id,
                detectedCity: bestCity,
                weatherDensity: mergedWeather,
              });
            }
          }
        } finally {
          set({ isHydrating: false });
        }
      },
    }),
    {
      name: 'wavii-saved-storage',
      partialize: (state) => ({ savedEventIds: state.savedEventIds }),
    }
  )
);

export function useFilteredEvents(): WaviiEvent[] {
  const events = useWaviiStore((s) => s.events);
  const weatherDensity = useWaviiStore((s) => s.weatherDensity);
  const activeNavTab = useWaviiStore((s) => s.activeNavTab);
  const savedEventIds = useWaviiStore((s) => s.savedEventIds);
  const searchQuery = useWaviiStore((s) => s.searchQuery);
  const maxPrice = useWaviiStore((s) => s.maxPrice);
  const distanceMiles = useWaviiStore((s) => s.distanceMiles);
  const selectedCategory = useWaviiStore((s) => s.selectedCategory);
  const selectedDay = useWaviiStore((s) => s.selectedDay);
  const selectedTags = useWaviiStore((s) => s.selectedTags);
  const selectedCities = useWaviiStore((s) => s.selectedCities);
  const onlyDryNights = useWaviiStore((s) => s.onlyDryNights);
  const minHypeScore = useWaviiStore((s) => s.minHypeScore);
  const sortField = useWaviiStore((s) => s.sortField);
  const sortOrder = useWaviiStore((s) => s.sortOrder);

  const parsedMaxPrice = maxPrice.trim() !== '' ? Number(maxPrice) : null;

  return events
    .filter((evt) => {
      if (activeNavTab === 'saved' && !savedEventIds.includes(evt.id)) {
        return false;
      }
      if (selectedCategory !== 'all' && evt.taxonomy !== selectedCategory) {
        return false;
      }
      if (evt.distanceMiles > distanceMiles) {
        return false;
      }
      if (parsedMaxPrice !== null && !Number.isNaN(parsedMaxPrice)) {
        if (evt.estimatedPrice > parsedMaxPrice) return false;
      }
      if (selectedTags.length > 0) {
        const hasMatchingTag = evt.tags.some((t) => selectedTags.includes(t));
        if (!hasMatchingTag) return false;
      }
      if (selectedCities.length > 0) {
        if (!selectedCities.includes(evt.cityState)) return false;
      }
      if (minHypeScore > 0 && evt.popularityScore < minHypeScore) {
        return false;
      }
      if (onlyDryNights) {
        const shortPrefix = evt.formattedDate.slice(0, 3).toLowerCase();
        const matchedDay = weatherDensity.find(
          (d) => d.shortDay.toLowerCase() === shortPrefix
        );
        if (matchedDay && matchedDay.precipChance >= 25) {
          return false;
        }
      }
      if (selectedDay) {
        const shortPrefix = selectedDay.slice(0, 3).toLowerCase();
        if (!evt.formattedDate.toLowerCase().startsWith(shortPrefix)) {
          return false;
        }
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesText =
          evt.title.toLowerCase().includes(q) ||
          evt.venueName.toLowerCase().includes(q) ||
          evt.cityState.toLowerCase().includes(q) ||
          evt.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesText) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'venue':
          comparison = a.venueName.localeCompare(b.venueName);
          break;
        case 'city':
          comparison = a.cityState.localeCompare(b.cityState);
          break;
        case 'price':
          comparison = a.estimatedPrice - b.estimatedPrice;
          break;
        case 'distance':
          comparison = a.distanceMiles - b.distanceMiles;
          break;
        case 'date':
          comparison =
            new Date(a.datetimeLocal).getTime() -
            new Date(b.datetimeLocal).getTime();
          break;
        default:
          comparison = a.popularityScore - b.popularityScore;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
}
