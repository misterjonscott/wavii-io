'use client';

import React from 'react';
import Image from 'next/image';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Heart,
  Info,
  SearchX,
  RotateCcw,
} from 'lucide-react';
import { useWaviiStore, useFilteredEvents } from '@/store/useWaviiStore';
import { SortField } from '@/types/wavii';
import { TAXONOMY_STYLES } from '@/data/mockData';
import { getEnvironmentalTags } from '@/lib/adapters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function EventDataTable() {
  const {
    sortField,
    sortOrder,
    selectedEventId,
    savedEventIds,
    selectedTags,
    weatherDensity,
    setSorting,
    setSelectedEventId,
    setDrawerMode,
    setViewMode,
    toggleSaveEvent,
    toggleTagToken,
    resetFilters,
  } = useWaviiStore();

  const filteredEvents = useFilteredEvents();

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="ml-1.5 h-3 w-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
      );
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1.5 h-3 w-3 text-purple-400" />
    ) : (
      <ArrowDown className="ml-1.5 h-3 w-3 text-purple-400" />
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="h-110 flex flex-col bg-surface-card/40">
        {/* Scrollable Table Viewport with Sticky Header */}
        <div className="flex-1 overflow-y-auto dark-scrollbar">
          <Table>
            <TableHeader className="bg-surface-card border-b border-border-muted shadow-sm">
              <TableRow className="border-border-muted hover:bg-transparent">
                <TableHead className="sticky top-0 z-20 bg-surface-card w-12 text-slate-300 font-semibold text-xs">
                  #
                </TableHead>

                <TableHead className="sticky top-0 z-20 bg-surface-card text-slate-300 font-semibold text-xs">
                  <button
                    onClick={() => setSorting('title')}
                    className="group inline-flex items-center hover:text-white transition-colors cursor-pointer"
                  >
                    Title {renderSortIcon('title')}
                  </button>
                </TableHead>

                <TableHead className="sticky top-0 z-20 bg-surface-card text-slate-300 font-semibold text-xs">
                  <button
                    onClick={() => setSorting('venue')}
                    className="group inline-flex items-center hover:text-white transition-colors cursor-pointer"
                  >
                    Location {renderSortIcon('venue')}
                  </button>
                </TableHead>

                <TableHead className="sticky top-0 z-20 bg-surface-card text-slate-300 font-semibold text-xs">
                  <button
                    onClick={() => setSorting('city')}
                    className="group inline-flex items-center hover:text-white transition-colors cursor-pointer"
                  >
                    City/State {renderSortIcon('city')}
                  </button>
                </TableHead>

                <TableHead className="sticky top-0 z-20 bg-surface-card text-slate-300 font-semibold text-xs">
                  <button
                    onClick={() => setSorting('date')}
                    className="group inline-flex items-center hover:text-white transition-colors cursor-pointer"
                  >
                    Date/Time {renderSortIcon('date')}
                  </button>
                </TableHead>

                <TableHead className="sticky top-0 z-20 bg-surface-card text-slate-300 font-semibold text-xs">
                  <button
                    onClick={() => setSorting('popularity')}
                    className="group inline-flex items-center hover:text-white transition-colors cursor-pointer"
                  >
                    Hype {renderSortIcon('popularity')}
                  </button>
                </TableHead>

                <TableHead className="sticky top-0 z-20 bg-surface-card text-slate-300 font-semibold text-xs">
                  Tags
                </TableHead>

                <TableHead className="sticky top-0 z-20 bg-surface-card text-right text-slate-300 font-semibold text-xs w-28">
                  <button
                    onClick={() => setSorting('price')}
                    className="group inline-flex items-center justify-end hover:text-white transition-colors ml-auto cursor-pointer"
                  >
                    Actions {renderSortIcon('price')}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>

            {filteredEvents.length > 0 && (
              <TableBody>
                {filteredEvents.map((event, idx) => {
                  const style = TAXONOMY_STYLES[event.taxonomy];
                  const isSelected = event.id === selectedEventId;
                  const isSaved = savedEventIds.includes(event.id);

                  return (
                    <TableRow
                      key={event.id}
                      onClick={() => {
                        setSelectedEventId(event.id);
                        setDrawerMode('detail');
                        setViewMode('map');
                      }}
                      className={`h-11 border-border-muted/80 transition-colors cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-purple-950/35 hover:bg-purple-950/45'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <TableCell className="text-slate-400 font-medium">
                        {idx + 1}
                      </TableCell>

                      <TableCell className="font-medium text-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <Image
                              src={event.imageUrl}
                              alt={event.title}
                              width={400}
                              height={400}
                              className="h-8 w-8 rounded-full object-cover border border-slate-700"
                            />
                            {event.imageAttribution && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute -bottom-1 -right-1 bg-surface-card border border-slate-700 rounded-full p-0.5 text-slate-300 hover:text-white"
                                  >
                                    <Info className="h-2.5 w-2.5" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-surface-card border-slate-700 text-slate-200 text-[11px]">
                                  {event.imageAttribution}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <span className="truncate max-w-60">
                            {event.title}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-slate-300">
                        {event.venueName}
                      </TableCell>

                      <TableCell className="text-sm text-slate-300">
                        <span>{event.cityState}</span>
                        <span className="ml-2 text-xs text-slate-400">
                          ({event.distanceMiles} mi)
                        </span>
                      </TableCell>

                      <TableCell className="text-slate-300">
                        {event.formattedDate}
                      </TableCell>

                      <TableCell className="text-purple-400 font-mono text-xs">
                        {event.popularityScore}/100
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {event.tags.map((tag) => {
                            const isTagActive = selectedTags.includes(tag);
                            return (
                              <Badge
                                key={tag}
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTagToken(tag);
                                }}
                                title={`Click to filter by tag: ${tag}`}
                                className={`${style.badgeBg} ${
                                  style.badgeText
                                } border ${
                                  isTagActive
                                    ? 'border-purple-400 ring-1 ring-purple-400/50'
                                    : style.border
                                } text-[10px] px-2 py-0 hover:opacity-80 cursor-pointer transition-all`}
                              >
                                {tag}
                              </Badge>
                            );
                          })}
                          {getEnvironmentalTags(event, weatherDensity)
                            .filter((badge) => badge.type !== 'aqi' && badge.type !== 'sunset')
                            .map((badge) => (
                              <span
                                key={badge.type}
                                className={`px-2 py-0.5 text-[10px] rounded border ${badge.colorClass} font-medium`}
                              >
                                {badge.label}
                              </span>
                            ))}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSaveEvent(event.id);
                                }}
                                className={`inline-flex items-center justify-center h-6 w-6 rounded-full border transition-colors cursor-pointer ${
                                  isSaved
                                    ? 'border-rose-500/80 bg-rose-500/20 text-rose-400'
                                    : 'border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50'
                                }`}
                              >
                                <Heart
                                  className={`h-3 w-3 ${
                                    isSaved ? 'fill-rose-400' : ''
                                  }`}
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-surface-card border-slate-700 text-slate-100 text-xs">
                              {isSaved ? 'Remove from Saved' : 'Save Event'}
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={event.seatgeekUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-emerald-500/70 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              >
                                <DollarSign className="h-3.5 w-3.5" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent className="bg-surface-card border-slate-700 text-slate-100 text-xs">
                              Est. from ${event.estimatedPrice} • View on
                              SeatGeek
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            )}
          </Table>

          {/* Centered Empty State inside the Full-Height 440px Container */}
          {filteredEvents.length === 0 && (
            <div className="h-90 flex flex-col items-center justify-center text-center px-6 space-y-3">
              <div className="h-10 w-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                <SearchX className="h-5 w-5" />
              </div>
              <div className="space-y-1 max-w-md">
                <p className="text-sm font-semibold text-slate-200">
                  No events match your active filter tokens
                </p>
                <p className="text-xs text-slate-400">
                  Try removing a filter pill above, expanding your mile radius,
                  or clearing all active filters.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="bg-purple-950/50 border-purple-500/50 text-purple-200 hover:bg-purple-900/60 hover:text-white text-xs h-8"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Clear active filters
              </Button>
            </div>
          )}
        </div>

        {/* Subtle Footer Status Bar inside the Fixed Container */}
        <div className="border-t border-border-muted/80 bg-surface-dark/60 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Showing <strong className="text-slate-200">{filteredEvents.length}</strong>{' '}
            {filteredEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
