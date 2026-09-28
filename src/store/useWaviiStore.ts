import { create } from 'zustand';
import {
  WaviiEvent,
  DailyWeatherAndDensity,
  EventTaxonomy,
  ViewMode,
  SortField,
  SortOrder,
  OpenMeteoRawDaily,
} from '@/types/wavii';
import { MOCK_EVENTS, MOCK_WEATHER_DENSITY } from '@/data/mockData';
import { mergeLiveWeatherWithDensity } from '@/lib/adapters';

interface WaviiState {
  events: WaviiEvent[];
  weatherDensity: DailyWeatherAndDensity[];
  weatherSource: 'mock' | 'live';
  eventSource: 'mock' | 'live';
  isHydrating: boolean;

  viewMode: ViewMode;
  searchQuery: string;
  maxPrice: string;
  distanceMiles: number;
  selectedCategory: 'all' | EventTaxonomy;
  selectedDay: string | null;
  selectedEventId: number;
  sortField: SortField;
  sortOrder: SortOrder;

  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setMaxPrice: (price: string) => void;
  setDistanceMiles: (miles: number) => void;
  setSelectedCategory: (category: 'all' | EventTaxonomy) => void;
  toggleCategoryShortcut: (category: EventTaxonomy) => void;
  toggleSelectedDay: (day: string) => void;
  setSelectedEventId: (id: number) => void;
  setSorting: (field: SortField) => void;
  resetFilters: () => void;
  hydrateLiveData: () => Promise<void>;
}

export const useWaviiStore = create<WaviiState>((set, get) => ({
  events: MOCK_EVENTS,
  weatherDensity: MOCK_WEATHER_DENSITY,
  weatherSource: 'mock',
  eventSource: 'mock',
  isHydrating: false,

  viewMode: 'list',
  searchQuery: '',
  maxPrice: '',
  distanceMiles: 25,
  selectedCategory: 'all',
  selectedDay: null,
  selectedEventId: MOCK_EVENTS[0].id,
  sortField: 'popularity',
  sortOrder: 'desc',

  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  setDistanceMiles: (distanceMiles) => set({ distanceMiles }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  toggleCategoryShortcut: (category) =>
    set((state) => ({
      selectedCategory: state.selectedCategory === category ? 'all' : category,
    })),

  toggleSelectedDay: (day) =>
    set((state) => ({
      selectedDay: state.selectedDay === day ? null : day,
    })),

  setSelectedEventId: (selectedEventId) => set({ selectedEventId }),

  setSorting: (field) =>
    set((state) => ({
      sortField: field,
      sortOrder:
        state.sortField === field && state.sortOrder === 'asc' ? 'desc' : 'asc',
    })),

  resetFilters: () =>
    set({
      searchQuery: '',
      maxPrice: '',
      distanceMiles: 25,
      selectedCategory: 'all',
      selectedDay: null,
      sortField: 'popularity',
      sortOrder: 'desc',
    }),

  hydrateLiveData: async () => {
    if (get().isHydrating) return;
    set({ isHydrating: true });

    try {
      // 1. Fetch real 7-day Indianapolis forecast from Open-Meteo (No API key needed)
      const weatherUrl =
        'https://api.open-meteo.com/v1/forecast?latitude=39.7684&longitude=-86.1581&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America%2FIndiana%2FIndianapolis';

      const [weatherRes, eventsRes] = await Promise.allSettled([
        fetch(weatherUrl),
        fetch('/api/events'),
      ]);

      if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
        const rawWeather = (await weatherRes.value.json()) as OpenMeteoRawDaily;
        if (rawWeather?.daily?.time) {
          const mergedWeather = mergeLiveWeatherWithDensity(
            rawWeather,
            get().weatherDensity
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
          set({
            events: payload.events,
            eventSource: payload.source,
            selectedEventId: payload.events[0].id,
          });
        }
      }
    } finally {
      set({ isHydrating: false });
    }
  },
}));

export function useFilteredEvents(): WaviiEvent[] {
  const events = useWaviiStore((s) => s.events);
  const searchQuery = useWaviiStore((s) => s.searchQuery);
  const maxPrice = useWaviiStore((s) => s.maxPrice);
  const distanceMiles = useWaviiStore((s) => s.distanceMiles);
  const selectedCategory = useWaviiStore((s) => s.selectedCategory);
  const selectedDay = useWaviiStore((s) => s.selectedDay);
  const sortField = useWaviiStore((s) => s.sortField);
  const sortOrder = useWaviiStore((s) => s.sortOrder);

  const parsedMaxPrice = maxPrice.trim() !== '' ? Number(maxPrice) : null;

  return events
    .filter((evt) => {
      if (selectedCategory !== 'all' && evt.taxonomy !== selectedCategory) {
        return false;
      }
      if (evt.distanceMiles > distanceMiles) {
        return false;
      }
      if (parsedMaxPrice !== null && !Number.isNaN(parsedMaxPrice)) {
        if (evt.estimatedPrice > parsedMaxPrice) return false;
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