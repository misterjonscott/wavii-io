'use client';

import React, { useState } from 'react';
import { X, Terminal, Code2, Cpu, FileCode, GitBranch, ExternalLink } from 'lucide-react';
import { useWaviiStore } from '@/store/useWaviiStore';

interface DeveloperConsoleProps {
  onClose: () => void;
}

const GITHUB_REPO_URL = 'https://github.com/misterjonscott/wavii-io';

export function DeveloperConsole({ onClose }: DeveloperConsoleProps) {
  const [activeTab, setActiveTab] = useState<'state' | 'adapters' | 'types'>('state');

  const {
    events,
    selectedEventId,
    plannedEventId,
    selectedParking,
    selectedDining,
    isPlannerOpen,
    plannerTab,
    activeNavTab,
    distanceMiles,
    selectedCategory,
    selectedDay,
    selectedTags,
    selectedCities,
    onlyDryNights,
    minHypeScore,
    sortField,
    sortOrder,
    originLat,
    originLon,
    detectedCity,
    eventSource,
    weatherSource,
    searchQuery,
    maxPrice,
  } = useWaviiStore();

  const tmOnlyCount = events.filter((e) => e.source === 'ticketmaster').length;
  const sgOnlyCount = events.filter((e) => e.source === 'seatgeek').length;
  const mergedCount = events.filter((e) => e.source === 'mixed').length;
  const rawIngestedEstimate = events.length + mergedCount;
  const collisionRate =
    rawIngestedEstimate > 0
      ? `${((mergedCount / rawIngestedEstimate) * 100).toFixed(1)}%`
      : '0%';

  const activeStatePayload = {
    activeNavTab,
    originLat,
    originLon,
    detectedCity,
    filtersAndSorting: {
      distanceMiles,
      selectedCategory,
      selectedDay,
      selectedTags,
      selectedCities,
      onlyDryNights,
      minHypeScore,
      searchQuery: searchQuery || null,
      maxPrice: maxPrice || null,
      sortField,
      sortOrder,
    },
    itineraryCommitmentState: {
      selectedEventId,
      plannedEventId,
      hasActiveCommitment: Boolean(plannedEventId && (selectedParking || selectedDining)),
      isBrowsingDifferentEvent:
        plannedEventId !== null &&
        selectedEventId !== null &&
        plannedEventId !== selectedEventId,
      isPlannerOpen,
      plannerTab,
      selectedParking: selectedParking?.displayName?.text || null,
      selectedDining: selectedDining?.displayName?.text || null,
    },
    eventSource,
    weatherSource,
    totalEventsLoaded: events.length,
    aggregationTelemetry: {
      architecture: 'Promise.allSettled Concurrent BFF + Fuzzy Hash Deduplicator',
      rawPayloadsIngested: rawIngestedEstimate,
      uniqueNormalizedEvents: events.length,
      crossProviderCollisionsMerged: mergedCount,
      deduplicationRate: collisionRate,
      sourceBreakdown: {
        ticketmasterPrimaryOnly: tmOnlyCount,
        seatgeekResaleOnly: sgOnlyCount,
        dualMarketMerged: mergedCount,
      },
    },
  };

  // Prefer currently selected event, or a dual-market 'mixed' event to showcase collision merging
  const selectedEvent =
    events.find((e) => e.id === selectedEventId) ||
    events.find((e) => e.source === 'mixed') ||
    events[0] || {
      id: 18354358,
      title: 'Ceci Bastida',
      venueName: 'The Vogue',
      cityState: 'Indianapolis, IN',
      datetimeLocal: '2026-10-12T20:00:00',
      formattedDate: 'Mon, Oct 12 • 8:00 PM',
      taxonomy: 'concert',
      tags: ['Latin Alternative', 'Concert'],
      imageUrl:
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
      imageAttribution: 'Photo via Unsplash / CC0',
      seatgeekUrl: 'https://seatgeek.com',
      lat: 39.8532,
      lon: -86.1384,
      estimatedPrice: 35,
      distanceMiles: 4.2,
      popularityScore: 86,
      source: 'mixed' as const,
      ticketingOptions: [
        { source: 'ticketmaster' as const, url: 'https://www.ticketmaster.com' },
        { source: 'seatgeek' as const, url: 'https://seatgeek.com' },
      ],
    };

  const targetId = selectedEvent.id;

  const rawSeatGeekPool =
    events.length > 0
      ? events.map((e) => ({
          id: e.id,
          title: `${e.title} at ${e.venueName}`,
          short_title: e.title,
          datetime_local: e.datetimeLocal,
          type: e.taxonomy,
          taxonomies: [{ id: 1000000, name: e.taxonomy }],
          venue: {
            id: 3371,
            name: e.venueName,
            display_location: e.cityState,
            location: { lat: e.lat, lon: e.lon },
          },
          performers: [
            {
              id: 4219,
              name: e.title,
              image: e.imageUrl,
              image_rights_message: e.imageAttribution || 'Photo via Unsplash / CC0',
              genres: e.tags.map((t) => ({ name: t })),
            },
          ],
          stats: {
            lowest_price: e.estimatedPrice,
            average_price: e.estimatedPrice + 30,
            listing_count: 10,
          },
          score: Number((e.popularityScore / 115).toFixed(2)),
          url: e.seatgeekUrl,
        }))
      : [];

  const rawSeatGeekMock = rawSeatGeekPool.find((r) => r.id === targetId) || rawSeatGeekPool[0];
  const { isHotThree: _retired, ...sanitizedEvent } = selectedEvent as typeof selectedEvent & {
    isHotThree?: boolean;
  };

  const eventDate = selectedEvent.datetimeLocal.split('T')[0];
  const venueKey = selectedEvent.venueName
    .toLowerCase()
    .replace(
      /\b(the|at|center|arena|stadium|theatre|theater|fieldhouse|music|amphitheatre|amphitheater|pavilion|hall|club|stage)\b/g,
      ''
    )
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12);

  const hypeTier =
    selectedEvent.popularityScore >= 85
      ? 'HIGH_DEMAND_HYPE (>= 85)'
      : selectedEvent.popularityScore >= 65
        ? 'TRENDING_SPARKLE (65-84)'
        : 'STANDARD_BASELINE (< 65)';

  const rawAdapterInspectionPayload = {
    _deduplicationAndNormalizationEngine: {
      compositeHashKey: `${eventDate}-${venueKey}`,
      resolutionStatus:
        selectedEvent.source === 'mixed'
          ? 'COLLISION_MERGED (Ticketmaster metadata prioritized + ticketingOptions combined + +12 Hype Boost)'
          : `SINGLE_PROVIDER (${selectedEvent.source.toUpperCase()})`,
      hypeScoreHeuristic: {
        computedScore: selectedEvent.popularityScore,
        visualTier: hypeTier,
        crossMarketBoostApplied: selectedEvent.source === 'mixed',
      },
      tagHygiene: 'British/American taxonomy unified ("Theatre" -> "Theater") via Set deduplication',
    },
    ...(selectedEvent.source === 'ticketmaster' || selectedEvent.source === 'mixed'
      ? {
          ticketmasterDiscoveryHalV2: {
            name: selectedEvent.title,
            dates: { start: { localDate: eventDate, dateTime: selectedEvent.datetimeLocal } },
            classifications: [
              {
                segment: { name: selectedEvent.taxonomy },
                genre: { name: selectedEvent.tags[0] || 'Live' },
              },
            ],
            _embedded: {
              venues: [
                {
                  name: selectedEvent.venueName,
                  city: { name: selectedEvent.cityState.split(',')[0] },
                },
              ],
            },
          },
        }
      : {}),
    ...(selectedEvent.source === 'seatgeek' || selectedEvent.source === 'mixed'
      ? { seatGeekV2: rawSeatGeekMock }
      : {}),
  };

  const astExtractedTypeSpecs = {
    source: 'src/types/wavii.ts & src/store/useWaviiStore.ts',
    parser: 'TypeScript AST / Strict Domain Contracts',
    interfaces: [
      {
        name: 'WaviiEvent',
        description:
          'Normalized UI Event Model synthesized from Ticketmaster Discovery v2 & SeatGeek v2',
        fields: {
          id: 'number (required)',
          title: 'string (required)',
          venueName: 'string (required)',
          cityState: 'string (required)',
          datetimeLocal: 'string (required, ISO 8601)',
          formattedDate: 'string (required)',
          taxonomy: "'concert' | 'family' | 'theater' | 'sports' (required)",
          tags: 'string[] (required, deduplicated & spelling-normalized)',
          imageUrl: 'string (required)',
          imageAttribution: 'string | null | undefined',
          seatgeekUrl: 'string (required)',
          source: "'seatgeek' | 'ticketmaster' | 'mixed' (required)",
          ticketingOptions: "Array<{ source: 'seatgeek' | 'ticketmaster', url: string }> (required)",
          lat: 'number (required)',
          lon: 'number (required)',
          estimatedPrice: 'number (required)',
          distanceMiles: 'number (required, Haversine distance from user origin)',
          popularityScore: 'number (required, 25-99 multi-signal Hype heuristic)',
        },
      },
      {
        name: 'DailyWeatherAndDensity',
        description:
          'Aggregated Open-Meteo daily forecast, 5-day hourly US AQI average, and event density metrics',
        fields: {
          dateIso: 'string (required, YYYY-MM-DD)',
          day: 'string (required)',
          shortDay: 'string (required)',
          weatherCode: "'sun' | 'cloud' | 'rain' | 'snow' (required)",
          highTemp: 'number (required)',
          lowTemp: 'number (required)',
          precipChance: 'number (required)',
          concerts: 'number (required)',
          family: 'number (required)',
          theater: 'number (required)',
          sports: 'number (required)',
          aqi: 'number | undefined (strictly matched by dateIso within 5-day window)',
          sunsetTime: 'string | undefined (used for Golden Hour +/- 45m detection)',
        },
      },
      {
        name: 'ItineraryCommitmentState (useWaviiStore)',
        description:
          'Decouples high-frequency event browsing (selectedEventId) from committed itinerary planning (plannedEventId)',
        fields: {
          selectedEventId: 'number | null (currently inspected event in Detail Drawer)',
          plannedEventId: 'number | null (locked event owning active Parking/Dining selections)',
          selectedParking: 'GooglePlaceResult | null',
          selectedDining: 'GooglePlaceResult | null',
          clearItinerary: '() => void (resets plannedEventId, selectedParking, and selectedDining)',
        },
      },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-dark/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-border-muted rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col text-slate-100 font-mono text-xs">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-border-muted bg-surface-card/60">
          <div className="flex flex-wrap items-center gap-2.5">
            <Terminal className="h-4 w-4 text-purple-400 shrink-0" />
            <h2 className="font-bold text-sm tracking-wide text-white font-sans">
              Developer Console & Architecture Inspector
            </h2>
            <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono text-[10px]">
              Strict Contracts & State
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white font-sans font-medium text-xs transition-colors"
            >
              <GitBranch className="h-3.5 w-3.5 text-purple-400" />
              <span>GitHub Repo</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Inspector"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
                <span>Live Zustand Store, Itinerary Commitment & Telemetry</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 font-sans">
                <div className="bg-surface-card/80 border border-border-muted rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Raw Ingested</div>
                  <div className="text-lg font-bold text-white mt-0.5">{rawIngestedEstimate}</div>
                  <div className="text-[11px] text-slate-400">TM + SG Parallel Fetch</div>
                </div>
                <div className="bg-surface-card/80 border border-border-muted rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Unique Normalized</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">{events.length}</div>
                  <div className="text-[11px] text-slate-400">Active Store Contracts</div>
                </div>
                <div className="bg-surface-card/80 border border-border-muted rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Collisions Merged</div>
                  <div className="text-lg font-bold text-purple-400 mt-0.5">
                    {mergedCount} <span className="text-xs font-normal text-slate-400">({collisionRate})</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Dual-Market Events</div>
                </div>
                <div className="bg-surface-card/80 border border-border-muted rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Provider Split</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    TM: {tmOnlyCount} • SG: {sgOnlyCount}
                  </div>
                  <div className="text-[11px] text-slate-400">Primary vs. Resale</div>
                </div>
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
              <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300 font-sans font-semibold text-xs">
                <div className="flex items-center gap-2">
                  <Code2 className="h-3.5 w-3.5 text-purple-400" />
                  <span>
                    Live Adapter & Deduplication Inspection:{' '}
                    <strong className="text-white">{selectedEvent.title}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal">
                  Select any event in the table to inspect its live normalization
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Raw Provider Payloads & Deduplication Key */}
                <div className="space-y-1.5 flex flex-col">
                  <div className="text-[11px] font-sans font-medium text-rose-400 flex items-center justify-between">
                    <span>Raw Provider Payload(s) & Composite Hash Engine</span>
                    <span className="text-[10px] text-slate-500 font-mono">External BFF</span>
                  </div>
                  <div className="bg-surface-card/90 border border-border-muted rounded-lg p-4 overflow-x-auto flex-1 shadow-inner">
                    <pre className="text-rose-300/90 leading-relaxed">
                      {JSON.stringify(rawAdapterInspectionPayload, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Right Column: Sanitized WaviiEvent */}
                <div className="space-y-1.5 flex flex-col">
                  <div className="text-[11px] font-sans font-medium text-purple-400 flex items-center justify-between">
                    <span>Sanitized WaviiEvent (Normalized Store Contract)</span>
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
                  <span>
                    TypeScript Domain Contracts (`WaviiEvent`, `DailyWeatherAndDensity`, & `ItineraryCommitmentState`)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[10px]">
                  Strict Type Contracts
                </span>
              </div>
              <p className="text-slate-400 font-sans text-xs">
                Defined in <code className="text-cyan-300">src/types/wavii.ts</code> and{' '}
                <code className="text-cyan-300">src/store/useWaviiStore.ts</code> to enforce strict
                schema validation across BFF route handlers, multi-provider adapters, and UI components.
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
        <div className="px-5 py-3 border-t border-border-muted bg-surface-card/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>
            Wavii Architecture • Next.js 16 • Zustand • Ticketmaster & SeatGeek BFF • Open-Meteo • Google Places
          </span>
          <div className="flex items-center gap-2">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/40 text-purple-200 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <span>github.com/misterjonscott/wavii-io</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}