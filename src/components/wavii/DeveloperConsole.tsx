'use client';

import React from 'react';
import { X, Terminal, Code2, Cpu } from 'lucide-react';
import { useWaviiStore } from '@/store/useWaviiStore';

interface DeveloperConsoleProps {
  onClose: () => void;
}

export function DeveloperConsole({ onClose }: DeveloperConsoleProps) {
  const {
    events,
    activeNavTab,
    distanceMiles,
    selectedCategory,
    selectedTags,
    selectedCities,
    originLat,
    originLon,
    detectedCity,
    eventSource,
    weatherSource,
    searchQuery,
    maxPrice,
  } = useWaviiStore();

  const activeStatePayload = {
    activeNavTab,
    originLat,
    originLon,
    detectedCity,
    distanceMiles,
    selectedCategory,
    selectedTags,
    selectedCities,
    searchQuery: searchQuery || null,
    maxPrice: maxPrice || null,
    eventSource,
    weatherSource,
    totalEventsLoaded: events.length,
  };

  const rawSeatGeekMock = {
    id: 18354358,
    title: "Ceci Bastida at The Vogue",
    short_title: "Ceci Bastida",
    datetime_local: "2026-10-12T20:00:00",
    type: "concert",
    taxonomies: [
      { id: 1000000, name: "concerts" },
      { id: 1010000, name: "alternative" }
    ],
    venue: {
      id: 3371,
      name: "The Vogue",
      display_location: "Indianapolis, IN",
      location: { lat: 39.8532, lon: -86.1384 }
    },
    performers: [
      {
        id: 4219,
        name: "Ceci Bastida",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
        image_rights_message: "Photo via Unsplash / CC0",
        genres: [{ name: "Latin Alternative" }]
      }
    ],
    stats: { lowest_price: 35, average_price: 65, listing_count: 12 },
    score: 0.84,
    url: "https://seatgeek.com/ceci-bastida-tickets/indy/2026-10-12/18354358"
  };

  const sanitizedEvent = events[0] || {
    id: 18354358,
    title: "Ceci Bastida",
    venueName: "The Vogue",
    cityState: "Indianapolis, IN",
    datetimeLocal: "2026-10-12T20:00:00",
    formattedDate: "Mon, Oct 12 • 8:00 PM",
    taxonomy: "concert",
    tags: ["Latin Alternative", "Concert"],
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
    imageAttribution: "Photo via Unsplash / CC0",
    seatgeekUrl: "https://seatgeek.com",
    lat: 39.8532,
    lon: -86.1384,
    estimatedPrice: 35,
    distanceMiles: 4.2,
    popularityScore: 84,
    isHotThree: true
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col text-slate-100 font-mono text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-4 w-4 text-purple-400" />
            <h2 className="font-bold text-sm tracking-wide text-white font-sans">
              Developer Console & Architecture Inspector
            </h2>
            <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono text-[10px]">
              Live State & Adapters
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Live Zustand State */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-sans font-semibold text-xs">
              <Cpu className="h-3.5 w-3.5 text-emerald-400" />
              <span>Section 1: Live Zustand Store & Geolocation State</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 overflow-x-auto shadow-inner">
              <pre className="text-emerald-400 leading-relaxed">
                {JSON.stringify(activeStatePayload, null, 2)}
              </pre>
            </div>
          </div>

          {/* Section 2: The Adapter Pattern */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-sans font-semibold text-xs">
              <Code2 className="h-3.5 w-3.5 text-purple-400" />
              <span>Section 2: The Adapter Pattern (Raw API Payload → Sanitized WaviiEvent Interface)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Raw SeatGeek */}
              <div className="space-y-1.5 flex flex-col">
                <div className="text-[11px] font-sans font-medium text-rose-400 flex items-center justify-between">
                  <span>Raw SeatGeek API Payload (Nested & Verbose)</span>
                  <span className="text-[10px] text-slate-500 font-mono">External</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 overflow-x-auto flex-1 shadow-inner">
                  <pre className="text-rose-300/90 leading-relaxed">
                    {JSON.stringify(rawSeatGeekMock, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Right Column: Sanitized WaviiEvent */}
              <div className="space-y-1.5 flex flex-col">
                <div className="text-[11px] font-sans font-medium text-purple-400 flex items-center justify-between">
                  <span>Sanitized WaviiEvent (Normalized & Distance-Aware)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Internal Store</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 overflow-x-auto flex-1 shadow-inner">
                  <pre className="text-purple-300 leading-relaxed">
                    {JSON.stringify(sanitizedEvent, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Wavii Architecture • MapLibre GL • Zustand • Open-Meteo & SeatGeek APIs</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
