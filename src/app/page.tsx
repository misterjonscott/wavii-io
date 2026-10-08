'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Radio,
} from 'lucide-react';
import { useWaviiStore, NavTab } from '@/store/useWaviiStore';
import { EventTaxonomy } from '@/types/wavii';
import { EventDataTable } from '@/components/wavii/EventDataTable';
import { WeatherDensityMatrix } from '@/components/wavii/WeatherDensityMatrix';
import { TokenizedFilterBar } from '@/components/wavii/TokenizedFilterBar';
import { DeveloperConsole } from '@/components/wavii/DeveloperConsole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';

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
    id: 'family',
    label: 'Family',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sports',
    label: 'Sports',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
  },
];

import { EventDetail } from '@/components/wavii/EventDetail';

export default function WaviiDashboard() {
  const [showDevConsole, setShowDevConsole] = useState(false);
  const {
    activeNavTab,
    savedEventIds,
    isFilterMenuOpen,
    searchQuery,
    maxPrice,
    distanceMiles,
    selectedCategory,
    weatherSource,
    eventSource,
    selectedEventId,
    setActiveNavTab,
    setIsFilterMenuOpen,
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
    { id: 'saved', label: 'Saved', badge: savedEventIds.length },
  ];

  return (
    <TooltipProvider delayDuration={120}>
      <div className="min-h-screen bg-surface-dark text-slate-50 px-6 py-5 font-sans">
        <main className="flex flex-col w-full max-w-7xl mx-auto space-y-4">
          {/* Top Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1
                style={{ fontFamily: 'var(--font-logo)' }}
                className="text-3xl tracking-wide bg-linear-to-r from-rose-500 via-pink-500 to-amber-500 bg-clip-text text-transparent py-1"
              >
                Wavii.io
              </h1>
              <button
                onClick={() => setShowDevConsole(true)}
                className="hidden sm:flex items-center gap-2 bg-surface-card/90 border border-border-muted px-2.5 py-1 rounded-full text-[11px] text-slate-300 font-mono hover:ring-1 hover:ring-purple-500/50 cursor-pointer transition-all"
                title="Open Developer Console"
              >
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
              </button>
            </div>

            <nav className="flex items-center bg-surface-card border border-border-muted rounded-md p-1 space-x-1">
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
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={`h-9 text-xs font-semibold border transition-all cursor-pointer ${
                isFilterMenuOpen
                  ? 'bg-purple-600 border-purple-300 text-white hover:bg-purple-500 shadow-md shadow-purple-500/30'
                  : 'bg-purple-950/50 border-purple-500/80 text-purple-200 hover:bg-purple-900/60 hover:border-purple-400 hover:text-white shadow-sm shadow-purple-500/20'
              }`}
            >
              Add filters{' '}
              <Plus
                className={`ml-1.5 h-3.5 w-3.5 transition-transform ${
                  isFilterMenuOpen ? 'rotate-45 text-purple-400' : ''
                }`}
              />
            </Button>

            {/* Search Input */}
            <div className="relative flex-1 min-w-55">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Enter location, venue, or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 bg-surface-card border-border-muted text-slate-100 text-xs! placeholder:text-xs placeholder:text-slate-400 focus-visible:ring-purple-500"
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
                  className="pl-6 pr-2.5 h-9 bg-surface-card border-border-muted text-slate-100 font-mono text-xs! placeholder:font-sans placeholder:text-xs placeholder:text-slate-500 focus-visible:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                <SelectTrigger className="w-28 h-9 bg-surface-card border-border-muted text-slate-200 text-xs!">
                  <SelectValue placeholder="Distance" />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border-muted text-slate-200">
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
                <SelectTrigger className="w-28 h-9 bg-surface-card border-border-muted text-slate-200 text-xs!">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border-muted text-slate-200">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="concert">Concerts</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="theater">Theater</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Tokenized Filter Builder & Active Token Pill Bar */}
          <TokenizedFilterBar />

          {/* Dynamic Table Container */}
          <motion.div
            layout
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-xl border border-border-muted bg-surface-card/70 overflow-hidden shadow-2xl ${
              selectedEventId ? 'max-h-[30vh]' : ''
            }`}
          >
            <EventDataTable />
          </motion.div>

          {/* Bottom Content Area with AnimatePresence */}
          <AnimatePresence mode="wait">
            {selectedEventId ? (
              <EventDetail key="event-detail" />
            ) : (
              <motion.div
                key="discovery-ui"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* 4 Category Shortcut Cards (Split Design) */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {CATEGORIES.map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategoryShortcut(cat.id)}
                        className={`group relative h-40 rounded-xl overflow-hidden border transition-all cursor-pointer flex flex-col ${
                          isActive
                            ? 'border-purple-500 ring-2 ring-purple-500/40'
                            : 'border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="h-[60%] w-full relative overflow-hidden">
                          <Image
                            src={cat.image}
                            alt={cat.label}
                            width={400}
                            height={240}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="h-[40%] w-full bg-slate-900 flex items-center px-4">
                          <span className="text-sm font-bold text-white tracking-wide">
                            {cat.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </section>

                {/* Weather & Event Density Matrix */}
                <WeatherDensityMatrix />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Developer Console Modal */}
          {showDevConsole && (
            <DeveloperConsole onClose={() => setShowDevConsole(false)} />
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
