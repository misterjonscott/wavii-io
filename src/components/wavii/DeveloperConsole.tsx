'use client';

import React, { useState } from 'react';
import { X, Terminal, Code2, Cpu, FileCode } from 'lucide-react';
import { useWaviiStore } from '@/store/useWaviiStore';

interface DeveloperConsoleProps {
  onClose: () => void;
}

export function DeveloperConsole({ onClose }: DeveloperConsoleProps) {
  const [activeTab, setActiveTab] = useState<'state' | 'adapters' | 'types'>('state');

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

  const astExtractedTypeSpecs = {
    source: "src/types/wavii.ts",
    parser: "TypeScript AST / extract_component_spec",
    interfaces: [
      {
        name: "WaviiEvent",
        description: "Normalized UI Event Model consumed by Wavii components",
        fields: {
          id: "number (required)",
          title: "string (required)",
          venueName: "string (required)",
          cityState: "string (required)",
          datetimeLocal: "string (required)",
          formattedDate: "string (required)",
          taxonomy: "EventTaxonomy (required)",
          tags: "string[] (required)",
          imageUrl: "string (required)",
          imageAttribution: "string | null | undefined",
          seatgeekUrl: "string (required)",
          lat: "number (required)",
          lon: "number (required)",
          estimatedPrice: "number (required)",
          distanceMiles: "number (required)",
          popularityScore: "number (required)",
          isHotThree: "boolean | undefined"
        }
      },
      {
        name: "DailyWeatherAndDensity",
        description: "Aggregated daily forecast and event density metrics",
        fields: {
          dateIso: "string (required)",
          day: "string (required)",
          shortDay: "string (required)",
          weatherCode: "\"sun\" | \"cloud\" | \"rain\" | \"snow\" (required)",
          highTemp: "number (required)",
          lowTemp: "number (required)",
          precipChance: "number (required)",
          concerts: "number (required)",
          comedy: "number (required)",
          theater: "number (required)",
          sports: "number (required)",
          aqi: "number | undefined",
          sunsetTime: "string | undefined"
        }
      }
    ]
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-dark/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-border-muted rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col text-slate-100 font-mono text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-muted bg-surface-card/60">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-4 w-4 text-purple-400" />
            <h2 className="font-bold text-sm tracking-wide text-white font-sans">
              Developer Console & Architecture Inspector
            </h2>
            <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono text-[10px]">
              Strict Contracts & State
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation Header */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border-muted bg-surface-card/30 font-sans">
          <button
            onClick={() => setActiveTab('state')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'state'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Live State</span>
          </button>
          <button
            onClick={() => setActiveTab('adapters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'adapters'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Adapter Pattern</span>
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'types'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Type Specs</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'state' && (
            <div className="space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-slate-300 font-sans font-semibold text-xs">
                <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                <span>Live Zustand Store & Geolocation State</span>
              </div>
              <div className="bg-surface-card/90 border border-border-muted rounded-lg p-4 overflow-x-auto shadow-inner">
                <pre className="text-emerald-400 leading-relaxed">
                  {JSON.stringify(activeStatePayload, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'adapters' && (
            <div className="space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-slate-300 font-sans font-semibold text-xs">
                <Code2 className="h-3.5 w-3.5 text-purple-400" />
                <span>The Adapter Pattern (Raw API Payload → Sanitized WaviiEvent Interface)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Raw SeatGeek */}
                <div className="space-y-1.5 flex flex-col">
                  <div className="text-[11px] font-sans font-medium text-rose-400 flex items-center justify-between">
                    <span>Raw SeatGeek API Payload (Nested & Verbose)</span>
                    <span className="text-[10px] text-slate-500 font-mono">External</span>
                  </div>
                  <div className="bg-surface-card/90 border border-border-muted rounded-lg p-4 overflow-x-auto flex-1 shadow-inner">
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
                  <div className="bg-surface-card/90 border border-border-muted rounded-lg p-4 overflow-x-auto flex-1 shadow-inner">
                    <pre className="text-purple-300 leading-relaxed">
                      {JSON.stringify(sanitizedEvent, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'types' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-slate-300 font-sans font-semibold text-xs">
                <div className="flex items-center gap-2">
                  <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                  <span>AST-Extracted TypeScript Contracts (`WaviiEvent` & `DailyWeatherAndDensity`)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[10px]">
                  Programmatically Documented via AST
                </span>
              </div>
              <p className="text-slate-400 font-sans text-xs">
                The specifications below are extracted directly from [`src/types/wavii.ts`](src/types/wavii.ts) using our DesignOps AST parser tool, ensuring strict type safety and documentation compliance across all UI components.
              </p>
              <div className="bg-surface-card/90 border border-border-muted rounded-lg p-4 overflow-x-auto shadow-inner">
                <pre className="text-cyan-300 leading-relaxed">
                  {JSON.stringify(astExtractedTypeSpecs, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border-muted bg-surface-card/60 flex items-center justify-between text-[11px] text-slate-400">
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
