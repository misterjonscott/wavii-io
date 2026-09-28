'use client';

import React, { useEffect } from 'react';
import {
  Map as MapIcon,
  List as ListIcon,
  Search,
  Plus,
  Radio,
} from 'lucide-react';
import { useWaviiStore, NavTab } from '@/store/useWaviiStore';
import { EventTaxonomy } from '@/types/wavii';
import { EventDataTable } from '@/components/wavii/EventDataTable';
import { EventMapView } from '@/components/wavii/EventMapView';
import { WeatherDensityMatrix } from '@/components/wavii/WeatherDensityMatrix';
import { TokenizedFilterBar } from '@/components/wavii/TokenizedFilterBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES: { id: EventTaxonomy; label: string; image: string }[] = [
  {
    id: 'theater',
    label: 'Theater',
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'concert',
    label: 'Concerts',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'comedy',
    label: 'Comedy',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sports',
    label: 'Sports',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
  },
];

export default function WaviiDashboard() {
  const {
    activeNavTab,
    savedEventIds,
    isFilterMenuOpen,
    viewMode,
    searchQuery,
    maxPrice,
    distanceMiles,
    selectedCategory,
    weatherSource,
    eventSource,
    setActiveNavTab,
    setIsFilterMenuOpen,
    setViewMode,
    setSearchQuery,
    setMaxPrice,
    setDistanceMiles,
    setSelectedCategory,
    toggleCategoryShortcut,
    hydrateLiveData,
  } = useWaviiStore();

  useEffect(() => {
    hydrateLiveData();
  }, [hydrateLiveData]);

  const navItems: { id: NavTab; label: string; badge?: number }[] = [
    { id: 'explore', label: 'Explore' },
    { id: 'trending', label: 'Trending' },
    { id: 'saved', label: 'Saved', badge: savedEventIds.length },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-6 py-5 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1
              style={{ fontFamily: 'var(--font-logo)' }}
              className="text-3xl tracking-wide bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 bg-clip-text text-transparent py-1"
            >
              Wavii.io
            </h1>
            <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-full text-[11px] text-slate-300 font-mono">
              <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
              <span>
                Weather:{' '}
                <strong className="text-emerald-400 uppercase">
                  {weatherSource}
                </strong>
              </span>
              <span className="text-slate-600">•</span>
              <span>
                Events:{' '}
                <strong
                  className={`uppercase ${
                    eventSource === 'live'
                      ? 'text-emerald-400'
                      : 'text-purple-400'
                  }`}
                >
                  {eventSource}
                </strong>
              </span>
            </div>
          </div>

          <nav className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-1 space-x-1">
            {navItems.map((item) => {
              const isActive = activeNavTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNavTab(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive
                          ? 'bg-purple-900 text-purple-100'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Unified Command Bar */}
        <section className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
            className={`h-9 text-xs transition-colors cursor-pointer ${
              isFilterMenuOpen
                ? 'bg-purple-950/60 border-purple-500 text-purple-100'
                : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Add filters{' '}
            <Plus
              className={`ml-1.5 h-3.5 w-3.5 transition-transform ${
                isFilterMenuOpen ? 'rotate-45 text-purple-400' : ''
              }`}
            />
          </Button>

          {/* Segmented Map / List Control */}
          <div className="flex items-center bg-slate-900 p-1 rounded-md border border-slate-800 h-9">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" /> Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Enter location, venue, or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 bg-slate-900 border-slate-800 text-slate-100 !text-xs placeholder:text-xs placeholder:text-slate-400 focus-visible:ring-purple-500"
            />
          </div>

          {/* Max Price with Embedded '$' Prefix & Clean 'Any' Placeholder */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
              Max Price
            </span>
            <div className="relative w-24">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none">
                $
              </span>
              <Input
                type="number"
                min="0"
                placeholder="Any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="pl-6 pr-2.5 h-9 bg-slate-900 border-slate-800 text-slate-100 font-mono !text-xs placeholder:font-sans placeholder:text-xs placeholder:text-slate-500 focus-visible:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Distance Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium">Distance</span>
            <Select
              value={String(distanceMiles)}
              onValueChange={(val) => setDistanceMiles(Number(val))}
            >
              <SelectTrigger className="w-28 h-9 bg-slate-900 border-slate-800 text-slate-200 !text-xs">
                <SelectValue placeholder="Distance" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                <SelectItem value="5">5 miles</SelectItem>
                <SelectItem value="10">10 miles</SelectItem>
                <SelectItem value="25">25 miles</SelectItem>
                <SelectItem value="50">50 miles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium">Type</span>
            <Select
              value={selectedCategory}
              onValueChange={(val) =>
                setSelectedCategory(val as 'all' | EventTaxonomy)
              }
            >
              <SelectTrigger className="w-28 h-9 bg-slate-900 border-slate-800 text-slate-200 !text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="concert">Concerts</SelectItem>
                <SelectItem value="comedy">Comedy</SelectItem>
                <SelectItem value="theater">Theater</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Tokenized Filter Builder & Active Token Pill Bar */}
        <TokenizedFilterBar />

        {/* Main Viewport: Fixed-Height List View vs Real WebGL Map + Sliding Drawer */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-2xl">
          {viewMode === 'list' ? <EventDataTable /> : <EventMapView />}
        </section>

        {/* 4 Category Shortcut Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategoryShortcut(cat.id)}
                className={`group relative h-36 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                  isActive
                    ? 'border-purple-500 ring-2 ring-purple-500/40'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/50 group-hover:bg-slate-950/30 transition-colors" />
                <div className="relative z-10 flex items-center justify-center h-full">
                  <span className="text-2xl font-bold text-white tracking-wide drop-shadow-md">
                    {cat.label}
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        {/* Weather & Event Density Matrix */}
        <WeatherDensityMatrix />
      </div>
    </div>
  );
}