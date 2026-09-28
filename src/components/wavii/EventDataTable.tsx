'use client';

import React from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Info,
} from 'lucide-react';
import { useWaviiStore, useFilteredEvents } from '@/store/useWaviiStore';
import { SortField } from '@/types/wavii';
import { TAXONOMY_STYLES } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
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
    setSorting,
    setSelectedEventId,
    setViewMode,
  } = useWaviiStore();

  const filteredEvents = useFilteredEvents();

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1.5 h-3 w-3 text-slate-500 group-hover:text-slate-300 transition-colors" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1.5 h-3 w-3 text-purple-400" />
    ) : (
      <ArrowDown className="ml-1.5 h-3 w-3 text-purple-400" />
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Table>
        <TableHeader className="bg-slate-900/95 border-b border-slate-800">
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="w-12 text-slate-300 font-semibold text-xs">#</TableHead>

            <TableHead className="text-slate-300 font-semibold text-xs">
              <button
                onClick={() => setSorting('title')}
                className="group inline-flex items-center hover:text-white transition-colors"
              >
                Title {renderSortIcon('title')}
              </button>
            </TableHead>

            <TableHead className="text-slate-300 font-semibold text-xs">
              <button
                onClick={() => setSorting('venue')}
                className="group inline-flex items-center hover:text-white transition-colors"
              >
                Location {renderSortIcon('venue')}
              </button>
            </TableHead>

            <TableHead className="text-slate-300 font-semibold text-xs">
              <button
                onClick={() => setSorting('city')}
                className="group inline-flex items-center hover:text-white transition-colors"
              >
                City/State {renderSortIcon('city')}
              </button>
            </TableHead>

            <TableHead className="text-slate-300 font-semibold text-xs">
              <button
                onClick={() => setSorting('date')}
                className="group inline-flex items-center hover:text-white transition-colors"
              >
                Date/Time {renderSortIcon('date')}
              </button>
            </TableHead>

            <TableHead className="text-slate-300 font-semibold text-xs">Tags</TableHead>

            <TableHead className="text-right text-slate-300 font-semibold text-xs w-24">
              <button
                onClick={() => setSorting('price')}
                className="group inline-flex items-center justify-end hover:text-white transition-colors ml-auto"
              >
                Tickets {renderSortIcon('price')}
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredEvents.length === 0 ? (
            <TableRow className="border-slate-800">
              <TableCell colSpan={7} className="h-32 text-center text-slate-400 text-sm">
                No events match your active filters. Try increasing the distance or resetting filters.
              </TableCell>
            </TableRow>
          ) : (
            filteredEvents.map((event, idx) => {
              const style = TAXONOMY_STYLES[event.taxonomy];
              const isSelected = event.id === selectedEventId;

              return (
                <TableRow
                  key={event.id}
                  onClick={() => {
                    setSelectedEventId(event.id);
                  }}
                  onDoubleClick={() => {
                    setSelectedEventId(event.id);
                    setViewMode('map');
                  }}
                  className={`border-slate-800/80 transition-colors cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-purple-950/30 hover:bg-purple-950/40'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  <TableCell className="text-slate-400 font-medium">{idx + 1}</TableCell>

                  {/* Title + Thumbnail + Optional Getty Rights Attribution */}
                  <TableCell className="font-medium text-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="h-8 w-11 rounded object-cover border border-slate-700"
                        />
                        {event.imageAttribution && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                onClick={(e) => e.stopPropagation()}
                                className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 rounded-full p-0.5 text-slate-300 hover:text-white"
                              >
                                <Info className="h-2.5 w-2.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 text-[11px]">
                              {event.imageAttribution}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <span className="truncate max-w-[240px]">{event.title}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-slate-300">{event.venueName}</TableCell>

                  <TableCell className="text-slate-300">
                    <span>{event.cityState}</span>
                    <span className="ml-2 text-[10px] text-slate-400">
                      ({event.distanceMiles} mi)
                    </span>
                  </TableCell>

                  <TableCell className="text-slate-300">{event.formattedDate}</TableCell>

                  <TableCell>
                    <div className="flex gap-1.5">
                      {event.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className={`${style.badgeBg} ${style.badgeText} border ${style.border} text-[10px] px-2 py-0`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
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
                      <TooltipContent className="bg-slate-900 border-slate-700 text-slate-100 text-xs">
                        Est. from ${event.estimatedPrice} • View on SeatGeek
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}