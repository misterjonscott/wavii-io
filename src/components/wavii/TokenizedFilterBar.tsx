'use client';

import React from 'react';
import { X, Tag, MapPin, Calendar, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useWaviiStore } from '@/store/useWaviiStore';

export function TokenizedFilterBar() {
  const {
    events,
    isFilterMenuOpen,
    activeNavTab,
    searchQuery,
    maxPrice,
    distanceMiles,
    selectedCategory,
    selectedDay,
    selectedTags,
    selectedCities,
    onlyDryNights,
    minHypeScore,
    setActiveNavTab,
    setSearchQuery,
    setMaxPrice,
    setDistanceMiles,
    setSelectedCategory,
    toggleSelectedDay,
    toggleTagToken,
    toggleCityToken,
    toggleOnlyDryNights,
    toggleMinHypeScore,
    resetFilters,
  } = useWaviiStore();

  // Dynamically derive available Tags and Cities from the loaded events
  const allAvailableTags = Array.from(
    new Set(events.flatMap((e) => e.tags))
  ).slice(0, 10);

  const allAvailableCities = Array.from(
    new Set(events.map((e) => e.cityState))
  ).slice(0, 6);

  // Build the array of active, removable filter tokens
  const activeTokens: Array<{
    id: string;
    facet: string;
    value: string;
    colorClass: string;
    onRemove: () => void;
  }> = [];

  if (activeNavTab === 'saved') {
    activeTokens.push({
      id: 'nav-saved',
      facet: 'View',
      value: 'Saved Events Only',
      colorClass: 'bg-rose-500/15 border-rose-500/50 text-rose-200',
      onRemove: () => setActiveNavTab('explore'),
    });
  }

  if (searchQuery.trim() !== '') {
    activeTokens.push({
      id: 'search',
      facet: 'Search',
      value: `"${searchQuery}"`,
      colorClass: 'bg-purple-500/15 border-purple-500/50 text-purple-200',
      onRemove: () => setSearchQuery(''),
    });
  }

  if (selectedCategory !== 'all') {
    const label =
      selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
    activeTokens.push({
      id: 'category',
      facet: 'Type',
      value: label,
      colorClass: 'bg-purple-500/15 border-purple-500/50 text-purple-200',
      onRemove: () => setSelectedCategory('all'),
    });
  }

  if (maxPrice.trim() !== '') {
    activeTokens.push({
      id: 'max-price',
      facet: 'Max Price',
      value: `≤ $${maxPrice}`,
      colorClass: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200',
      onRemove: () => setMaxPrice(''),
    });
  }

  if (distanceMiles !== 50) {
    activeTokens.push({
      id: 'distance',
      facet: 'Distance',
      value: `≤ ${distanceMiles} miles`,
      colorClass: 'bg-teal-500/15 border-teal-500/50 text-teal-200',
      onRemove: () => setDistanceMiles(50),
    });
  }

  if (selectedDay) {
    activeTokens.push({
      id: 'day',
      facet: 'Day',
      value: selectedDay,
      colorClass: 'bg-amber-500/15 border-amber-500/50 text-amber-200',
      onRemove: () => toggleSelectedDay(selectedDay),
    });
  }

  selectedTags.forEach((tag) => {
    activeTokens.push({
      id: `tag-${tag}`,
      facet: 'Tag',
      value: tag,
      colorClass: 'bg-purple-500/15 border-purple-500/50 text-purple-200',
      onRemove: () => toggleTagToken(tag),
    });
  });

  selectedCities.forEach((city) => {
    activeTokens.push({
      id: `city-${city}`,
      facet: 'City',
      value: city,
      colorClass: 'bg-teal-500/15 border-teal-500/50 text-teal-200',
      onRemove: () => toggleCityToken(city),
    });
  });

  if (onlyDryNights) {
    activeTokens.push({
      id: 'dry-nights',
      facet: 'Weather',
      value: 'Dry Nights (<25% Rain)',
      colorClass: 'bg-sky-500/15 border-sky-500/50 text-sky-200',
      onRemove: () => toggleOnlyDryNights(),
    });
  }

  if (minHypeScore > 0) {
    activeTokens.push({
      id: 'min-hype',
      facet: 'Hype Score',
      value: `${minHypeScore}+`,
      colorClass: 'bg-rose-500/15 border-rose-500/50 text-rose-200',
      onRemove: () => toggleMinHypeScore(),
    });
  }

  if (!isFilterMenuOpen && activeTokens.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      {/* 1. Expandable Filter Builder Tray (When "Add filters +" is clicked) */}
      {isFilterMenuOpen && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5 space-y-3 text-xs shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Facet Group 1: Genre & Event Tags */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <Tag className="h-3 w-3 text-purple-400" /> Filter by Genre / Tag
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allAvailableTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTagToken(tag)}
                      className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Facet Group 2: City / Municipality */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <MapPin className="h-3 w-3 text-teal-400" /> Filter by City
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allAvailableCities.map((city) => {
                  const active = selectedCities.includes(city);
                  return (
                    <button
                      key={city}
                      onClick={() => toggleCityToken(city)}
                      className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-teal-600 border-teal-400 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Facet Group 3: Cross-API Weather & Hype Conditions */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <Sparkles className="h-3 w-3 text-amber-400" /> Smart Conditions
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={toggleOnlyDryNights}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all cursor-pointer ${
                    onlyDryNights
                      ? 'bg-sky-600 border-sky-400 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  Dry Nights (&lt;25% Rain)
                </button>
                <button
                  onClick={toggleMinHypeScore}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all cursor-pointer ${
                    minHypeScore === 85
                      ? 'bg-rose-600 border-rose-400 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  High Hype (85+ Score)
                </button>
                <button
                  onClick={() => setMaxPrice(maxPrice === '45' ? '' : '45')}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all cursor-pointer ${
                    maxPrice === '45'
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  Under $45
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. The Active Tokenized Filter Pill Bar (Between Command Bar and Map/Table) */}
      {activeTokens.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800/90 text-xs">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mr-1">
            <SlidersHorizontal className="h-3 w-3 text-purple-400" />
            Active Filters:
          </span>

          {activeTokens.map((token) => (
            <span
              key={token.id}
              className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-full border text-[11px] font-medium transition-all ${token.colorClass}`}
            >
              <span className="opacity-75 font-normal">{token.facet}:</span>
              <span className="font-semibold">{token.value}</span>
              <button
                onClick={token.onRemove}
                className="p-0.5 rounded-full hover:bg-slate-950/50 transition-colors cursor-pointer"
                title={`Remove ${token.facet} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          <button
            onClick={resetFilters}
            className="ml-auto text-[11px] font-medium text-slate-400 hover:text-rose-400 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Clear all ({activeTokens.length})
          </button>
        </div>
      )}
    </div>
  );
}