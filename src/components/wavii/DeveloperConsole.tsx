'use client';

import React, { useState, useEffect } from 'react';
import { X, Terminal, Code2, Cpu, FileCode, GitBranch, ExternalLink, Database, Server, Loader2 } from 'lucide-react';
import { useWaviiStore } from '@/store/useWaviiStore';

interface DeveloperConsoleProps {
  onClose: () => void;
}

const GITHUB_REPO_URL = 'https://github.com/misterjonscott/wavii-io';

export function DeveloperConsole({ onClose }: DeveloperConsoleProps) {
  const [activeTab, setActiveTab] = useState<'state' | 'adapters' | 'types' | 'payloads'>('state');
  const [typeSpecsContent, setTypeSpecsContent] = useState<string | null>(null);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (activeTab === 'types' && !typeSpecsContent) {
      const fetchSpecs = async () => {
        setIsLoadingSpecs(true);
        try {
          const res = await fetch('/api/type-specs');
          const data = await res.json();
          if (!isMounted) return;
          
          const storeContent = data.store || '';
          const actionMatches = storeContent.match(/([a-zA-Z0-9_]+):\s*\([^)]*\)\s*=>/g) || [];
          const actionsFormatted = actionMatches.map((m: string) => `  ${m} ...`).join('\n');
          
          const fullSpecs = `// === RUNTIME STATE ACTIONS (useWaviiStore) ===\n${actionsFormatted}\n\n// === DOMAIN CONTRACTS (types/wavii.ts) ===\n${data.extractedInterfaces}`;
          
          setTypeSpecsContent(fullSpecs || 'Failed to load type specs.');
        } catch (err) {
          console.error('Failed to load type specs', err);
          if (isMounted) setTypeSpecsContent('Error loading type specs.');
        } finally {
          if (isMounted) setIsLoadingSpecs(false);
        }
      };
      fetchSpecs();
    }
    return () => { isMounted = false; };
  }, [activeTab, typeSpecsContent]);

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
      source: 'mixed' as const,
      ticketingOptions: [
        { source: 'ticketmaster' as const, url: 'https://www.ticketmaster.com' },
        { source: 'seatgeek' as const, url: 'https://seatgeek.com' },
      ],
      lat: 39.8532,
      lon: -86.1384,
      estimatedPrice: 35,
      distanceMiles: 4.2,
      popularityScore: 86,
    };

  const sanitizedEvent = selectedEvent;

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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/95 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white font-sans font-medium text-xs transition-colors"
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
        <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 border-b border-border-muted bg-surface-card/30 font-sans">
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
          <button
            onClick={() => setActiveTab('payloads')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'payloads'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Raw BFF Payloads</span>
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
                    Adapter Inspection: <strong className="text-white">{selectedEvent.title}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal">
                  Select any event in table to inspect its live normalization
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 flex flex-col">
                  <div className="text-[11px] font-sans font-medium text-rose-400 flex items-center justify-between">
                    <span>True Raw Provider Payload(s)</span>
                    <span className="text-[10px] text-slate-500 font-mono">External API</span>
                  </div>
                  <div className="bg-surface-card/90 border border-border-muted rounded-lg p-4 overflow-x-auto flex-1 shadow-inner">
                    <pre className="text-rose-300/90 leading-relaxed">
                      {JSON.stringify(
                        {
                          source: selectedEvent.source,
                          ticketmasterRaw: selectedEvent.rawTicketmasterPayload || 'N/A (Single Provider or Pending Capture)',
                          seatgeekRaw: selectedEvent.rawSeatGeekPayload || 'N/A (Single Provider or Pending Capture)',
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <div className="text-[11px] font-sans font-medium text-purple-400 flex items-center justify-between">
                    <span>Sanitized WaviiEvent (Store Contract)</span>
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
            <div className="space-y-3 animate-in fade-in duration-150 flex flex-col h-full">
              <div className="flex items-center justify-between text-slate-300 font-sans font-semibold text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                  <span>TypeScript Domain Contracts & Store Interfaces</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[10px]">
                  Live Type Specs
                </span>
              </div>
              <div className="bg-surface-card/90 border border-border-muted rounded-lg p-4 overflow-auto shadow-inner flex-1 max-h-[500px]">
                {isLoadingSpecs ? (
                  <div className="flex items-center gap-2 text-cyan-400/70 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading runtime type contracts...</span>
                  </div>
                ) : (
                  <pre className="text-cyan-300 text-[11px] leading-relaxed">
                    {typeSpecsContent || 'No type specs loaded.'}
                  </pre>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payloads' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-slate-300 font-sans font-semibold text-xs">
                <Server className="h-3.5 w-3.5 text-emerald-400" />
                <span>Raw BFF Upstream API Responses (Ticketmaster v2 & SeatGeek v2)</span>
              </div>
              <p className="text-slate-400 font-sans text-xs">
                Inspecting raw responses from concurrent API calls (`Promise.allSettled`). Select an event to view its upstream source payloads.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-card/90 border border-border-muted rounded-lg p-4 overflow-x-auto shadow-inner">
                  <div className="text-[11px] font-sans font-medium text-emerald-400 mb-2">Ticketmaster Discovery v2 Raw Payload</div>
                  <pre className="text-emerald-300 text-[11px] leading-relaxed max-h-96 overflow-y-auto">
                    {JSON.stringify(selectedEvent.rawTicketmasterPayload || { note: 'No Ticketmaster raw payload attached to this item' }, null, 2)}
                  </pre>
                </div>
                <div className="bg-surface-card/90 border border-border-muted rounded-lg p-4 overflow-x-auto shadow-inner">
                  <div className="text-[11px] font-sans font-medium text-emerald-400 mb-2">SeatGeek v2 Raw Payload</div>
                  <pre className="text-emerald-300 text-[11px] leading-relaxed max-h-96 overflow-y-auto">
                    {JSON.stringify(selectedEvent.rawSeatGeekPayload || { note: 'No SeatGeek raw payload attached to this item' }, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border-muted bg-surface-card/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Wavii Architecture • Next.js 16 • Zustand • BFF & Deduplicator Engine</span>
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