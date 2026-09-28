'use client';

import React, { useState } from 'react';
import {
  Navigation,
  CalendarPlus,
  ZoomIn,
  ZoomOut,
  Compass,
  ExternalLink,
  ArrowLeft,
  MapPin,
  Sparkles,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Droplets,
} from 'lucide-react';
import { useWaviiStore, useFilteredEvents } from '@/store/useWaviiStore';
import { WaviiEvent } from '@/types/wavii';
import { TAXONOMY_STYLES } from '@/data/mockData';
import {
  getVenueDirectionsUrl,
  getGoogleCalendarUrl,
} from '@/lib/eventActions';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Geographic bounding box for Greater Indianapolis / Central Indiana
const MAP_BOUNDS = {
  minLat: 39.70,
  maxLat: 40.06,
  minLon: -86.42,
  maxLon: -85.88,
};

export function EventMapView() {
  const {
    events,
    weatherDensity,
    selectedEventId,
    setSelectedEventId,
    distanceMiles,
  } = useWaviiStore();

  const filteredEvents = useFilteredEvents();
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [drawerMode, setDrawerMode] = useState<'hot-three' | 'detail'>('hot-three');

  const activeEvent =
    events.find((e) => e.id === selectedEventId) ||
    filteredEvents[0] ||
    events[0];

  // Build the 3-card list: start with top 3, but if the user selected a map pin
  // outside the top 3, swap it into the 3rd slot so it's always visible & highlighted
  const baseTopThree =
    filteredEvents.length >= 3
      ? filteredEvents.slice(0, 3)
      : events.filter((e) => e.isHotThree).slice(0, 3);

  const isInBaseTopThree = baseTopThree.some((e) => e.id === activeEvent?.id);
  const displayedThreeEvents: WaviiEvent[] =
    isInBaseTopThree || !activeEvent
      ? baseTopThree
      : [...baseTopThree.slice(0, 2), activeEvent];

  // Handle clicking a pill marker on the map
  const handleMarkerClick = (event: WaviiEvent) => {
    const wasAlreadySelected = event.id === activeEvent?.id;
    const isOneOfBaseTopThree = baseTopThree.some((e) => e.id === event.id);

    setSelectedEventId(event.id);

    // If clicking a pin outside the initial Hot Three, or clicking an already-selected
    // Hot Three pin a second time, smoothly glide open the Detail Drawer
    if (!isOneOfBaseTopThree || wasAlreadySelected) {
      setDrawerMode('detail');
    }
  };

  // Match the active event's day of week with our 7-day Weather matrix
  const activeDayPrefix = activeEvent?.formattedDate.slice(0, 3).toLowerCase();
  const matchedWeather =
    weatherDensity.find(
      (d) => d.shortDay.toLowerCase() === activeDayPrefix
    ) || weatherDensity[0];

  // Project lat/lon to percentage X/Y coordinates inside the map viewport,
  // adding a slight deterministic offset for venues that share coordinates
  const projectCoordinates = (event: WaviiEvent, index: number) => {
    const xPercent =
      ((event.lon - MAP_BOUNDS.minLon) /
        (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) *
      100;
    const yPercent =
      ((MAP_BOUNDS.maxLat - event.lat) /
        (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) *
      100;

    // Slight stagger so events at the same arena (e.g. Gainbridge) don't stack 100% on top of each other
    const staggerX = (index % 2 === 0 ? 1 : -1) * (index > 2 ? 2.2 : 0);
    const staggerY = index > 2 ? (index % 3) * 2.5 - 2 : 0;

    return {
      x: Math.min(Math.max(xPercent + staggerX, 12), 88),
      y: Math.min(Math.max(yPercent + staggerY, 14), 86),
    };
  };

  const renderWeatherIcon = (code: string) => {
    switch (code) {
      case 'rain':
        return <CloudRain className="h-4 w-4 text-sky-400" />;
      case 'cloud':
        return <Cloud className="h-4 w-4 text-slate-300" />;
      case 'snow':
        return <Snowflake className="h-4 w-4 text-cyan-300" />;
      default:
        return <Sun className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[440px]">
        {/* Left 7 Columns: Interactive Cyber-Teal Spatial Map */}
        <div className="lg:col-span-7 relative bg-slate-950 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800 select-none min-h-[380px]">
          {/* Scalable Map Canvas */}
          <div
            style={{ transform: `scale(${zoomLevel})` }}
            className="absolute inset-0 transition-transform duration-300 ease-out origin-center"
          >
            {/* Dark Cyber-Teal Vector Street Grid SVG */}
            <svg
              className="w-full h-full opacity-45"
              viewBox="0 0 800 500"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <pattern
                  id="minorGrid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth="0.7"
                    strokeOpacity="0.45"
                  />
                </pattern>
                <pattern
                  id="majorGrid"
                  width="160"
                  height="160"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="160" height="160" fill="url(#minorGrid)" />
                  <path
                    d="M 160 0 L 0 0 0 160"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="1.4"
                    strokeOpacity="0.55"
                  />
                </pattern>
              </defs>

              <rect width="800" height="500" fill="url(#majorGrid)" />

              {/* Stylized I-465 Beltway & White River Arterials */}
              <ellipse
                cx="410"
                cy="270"
                rx="230"
                ry="155"
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeOpacity="0.5"
                strokeDasharray="8 4"
              />
              <path
                d="M 120 40 Q 290 170 410 270 T 720 470"
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="2.5"
                strokeOpacity="0.65"
              />
              <path
                d="M 410 270 Q 520 180 680 65"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="2.2"
                strokeOpacity="0.6"
              />
              <path
                d="M 540 20 C 470 110, 440 190, 395 275 C 355 350, 310 420, 260 490"
                fill="none"
                stroke="#0284c7"
                strokeWidth="6"
                strokeOpacity="0.35"
              />
            </svg>

            {/* Subtle Regional District Labels */}
            <span className="absolute top-[16%] left-[18%] text-[10px] font-semibold tracking-widest uppercase text-teal-500/60 pointer-events-none">
              Whitestown / Boone Co.
            </span>
            <span className="absolute top-[14%] right-[14%] text-[10px] font-semibold tracking-widest uppercase text-teal-500/60 pointer-events-none">
              Noblesville / Ruoff
            </span>
            <span className="absolute top-[34%] right-[22%] text-[10px] font-semibold tracking-widest uppercase text-teal-500/60 pointer-events-none">
              Fishers District
            </span>
            <span className="absolute top-[42%] left-[44%] text-[10px] font-semibold tracking-widest uppercase text-teal-500/60 pointer-events-none">
              Broad Ripple
            </span>
            <span className="absolute top-[55%] left-[42%] text-lg font-bold tracking-wide text-slate-100/90 drop-shadow pointer-events-none">
              Indianapolis
            </span>
            <span className="absolute bottom-[18%] left-[30%] text-[10px] font-semibold tracking-widest uppercase text-teal-500/60 pointer-events-none">
              White River State Park
            </span>

            {/* Interactive Event Pill Markers */}
            {filteredEvents.map((event, index) => {
              const pos = projectCoordinates(event, index);
              const isSelected = event.id === activeEvent?.id;

              return (
                <button
                  key={event.id}
                  onClick={() => handleMarkerClick(event)}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className={`group absolute -translate-x-1/2 -translate-y-full transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'z-30 scale-110'
                      : 'z-10 hover:z-20 hover:scale-105'
                  }`}
                >
                  <div
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium whitespace-nowrap transition-all duration-200 shadow-lg ${
                      isSelected
                        ? 'bg-purple-700 text-white border-2 border-teal-300 shadow-purple-500/30'
                        : 'bg-teal-950/90 text-teal-300 border border-teal-700/80 hover:bg-teal-900 hover:text-white hover:border-teal-400'
                    }`}
                  >
                    {event.title}
                  </div>
                  {/* Downward Callout Pointer Triangle */}
                  <div
                    className={`mx-auto w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] transition-colors ${
                      isSelected
                        ? 'border-t-teal-300'
                        : 'border-t-teal-700/80 group-hover:border-t-teal-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Floating Top-Left Status Pill */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-md text-xs text-slate-300 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            <span>
              Showing <strong>{filteredEvents.length}</strong> events within{' '}
              <strong>{distanceMiles} mi</strong>
            </span>
          </div>

          {/* Floating Bottom-Right Map Controls */}
          <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-md shadow-lg">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 1.75))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 1))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Reset Viewport"
            >
              <Compass className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Hardware-Accelerated Sliding Track Drawer */}
        <div className="lg:col-span-5 bg-slate-950/95 overflow-hidden relative">
          <div
            className={`flex w-[200%] h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              drawerMode === 'detail' ? '-translate-x-1/2' : 'translate-x-0'
            }`}
          >
            {/* Panel 1 (Left Half of Track): Hot Three List */}
            <div className="w-1/2 p-5 flex flex-col justify-between shrink-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12" />
                  <h2 className="text-2xl font-bold text-center tracking-tight text-white">
                    Hot Three
                  </h2>
                  <button
                    onClick={() => setDrawerMode('detail')}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium w-12 text-right transition-colors"
                  >
                    Inspect →
                  </button>
                </div>

                <div className="space-y-3">
                  {displayedThreeEvents.map((event) => {
                    const isSelected = event.id === activeEvent?.id;
                    const isPinnedFromMap =
                      !isInBaseTopThree && event.id === activeEvent?.id;

                    return (
                      <div
                        key={event.id}
                        onClick={() => {
                          if (isSelected) {
                            setDrawerMode('detail');
                          } else {
                            setSelectedEventId(event.id);
                          }
                        }}
                        className={`flex gap-3.5 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-purple-700 text-white shadow-lg ring-1 ring-purple-400/60'
                            : 'bg-slate-900/60 hover:bg-slate-900 text-slate-200 border border-slate-800/80'
                        }`}
                      >
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-28 h-20 object-cover rounded-md shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-sm truncate">
                              {event.title}
                            </h3>
                            <span
                              className={`text-[11px] font-mono font-semibold shrink-0 ${
                                isSelected
                                  ? 'text-purple-100'
                                  : 'text-emerald-400'
                              }`}
                            >
                              ${event.estimatedPrice}+
                            </span>
                          </div>

                          {/* Venue Row + Functional Directions Icon Button */}
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`truncate ${
                                isSelected ? 'text-white' : 'text-slate-300'
                              }`}
                            >
                              {event.venueName}
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={getVenueDirectionsUrl(event)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className={`p-1 rounded transition-colors shrink-0 ml-2 ${
                                    isSelected
                                      ? 'hover:bg-purple-600 text-white'
                                      : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                                  }`}
                                >
                                  <Navigation className="h-3.5 w-3.5" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 border border-slate-700 text-slate-100 text-xs">
                                Get Directions to {event.venueName}
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          <p
                            className={`text-xs ${
                              isSelected ? 'text-purple-100' : 'text-slate-400'
                            }`}
                          >
                            {event.cityState} ({event.distanceMiles} mi)
                          </p>

                          {/* Date Row + Functional Add to Calendar Icon Button */}
                          <div className="flex items-center justify-between text-xs pt-0.5">
                            <span
                              className={
                                isSelected
                                  ? 'text-white font-medium'
                                  : 'text-slate-300'
                              }
                            >
                              {event.formattedDate}
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={getGoogleCalendarUrl(event)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className={`p-1 rounded transition-colors shrink-0 ml-2 ${
                                    isSelected
                                      ? 'hover:bg-purple-600 text-white'
                                      : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                                  }`}
                                >
                                  <CalendarPlus className="h-3.5 w-3.5" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 border border-slate-700 text-slate-100 text-xs">
                                Add to Google Calendar
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Taxonomy Pills & Details Trigger */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              {event.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 text-[10px] rounded-full bg-slate-950/85 text-slate-100 font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                              {isPinnedFromMap && (
                                <span className="px-1.5 py-0.5 text-[9px] rounded bg-teal-500/30 border border-teal-300/50 text-teal-100 font-mono">
                                  Map Pin
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEventId(event.id);
                                setDrawerMode('detail');
                              }}
                              className={`text-[11px] font-medium underline underline-offset-2 ${
                                isSelected
                                  ? 'text-white hover:text-purple-200'
                                  : 'text-purple-400 hover:text-purple-300'
                              }`}
                            >
                              Details →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Panel 2 (Right Half of Track): Selected Event Detail Drawer */}
            <div className="w-1/2 p-5 flex flex-col justify-between shrink-0">
              {activeEvent && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <button
                      onClick={() => setDrawerMode('hot-three')}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Hot Three
                    </button>
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-purple-400">
                      <Sparkles className="h-3.5 w-3.5" /> Hype Score:{' '}
                      {activeEvent.popularityScore}/100
                    </span>
                  </div>

                  <div className="relative h-40 w-full rounded-lg overflow-hidden border border-slate-800">
                    <img
                      src={activeEvent.imageUrl}
                      alt={activeEvent.title}
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <div className="flex gap-1.5 mb-1">
                          {activeEvent.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`px-2 py-0.5 text-[10px] rounded-full border ${
                                TAXONOMY_STYLES[activeEvent.taxonomy].badgeBg
                              } ${TAXONOMY_STYLES[activeEvent.taxonomy].badgeText} ${
                                TAXONOMY_STYLES[activeEvent.taxonomy].border
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight">
                          {activeEvent.title}
                        </h3>
                      </div>
                      <span className="bg-emerald-500 text-slate-950 font-mono font-bold text-xs px-2.5 py-1 rounded-md shrink-0">
                        From ${activeEvent.estimatedPrice}
                      </span>
                    </div>
                  </div>

                  {/* Venue & Date Metadata Box */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-200">
                        <MapPin className="h-4 w-4 text-purple-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">
                            {activeEvent.venueName}
                          </p>
                          <p className="text-slate-400">
                            {activeEvent.cityState} • {activeEvent.distanceMiles} miles away
                          </p>
                        </div>
                      </div>
                      <a
                        href={getVenueDirectionsUrl(activeEvent)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors shrink-0"
                      >
                        <Navigation className="h-3.5 w-3.5 text-teal-400" /> Directions
                      </a>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-2.5">
                      <div className="text-slate-200">
                        <p className="font-semibold text-white">
                          {activeEvent.formattedDate}
                        </p>
                        <p className="text-slate-400">Doors open 1 hour prior</p>
                      </div>
                      <a
                        href={getGoogleCalendarUrl(activeEvent)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors shrink-0"
                      >
                        <CalendarPlus className="h-3.5 w-3.5 text-purple-400" /> Add to Cal
                      </a>
                    </div>
                  </div>

                  {/* Cross-Referenced Show-Night Weather Forecast */}
                  {matchedWeather && (
                    <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-lg px-3.5 py-2.5 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        {renderWeatherIcon(matchedWeather.weatherCode)}
                        <span className="text-slate-300 font-sans font-medium">
                          Show-Night Forecast ({matchedWeather.day}):
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-100">
                          {matchedWeather.highTemp}° | {matchedWeather.lowTemp}°
                        </span>
                        <span className="flex items-center text-sky-400">
                          <Droplets className="h-3 w-3 mr-0.5" />
                          {matchedWeather.precipChance}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Primary SeatGeek Ticket CTA */}
                  <Button
                    asChild
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold h-10"
                  >
                    <a
                      href={activeEvent.seatgeekUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Find Tickets on SeatGeek{' '}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}