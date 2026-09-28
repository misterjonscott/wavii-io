'use client';

import React, { useState, useRef, useEffect } from 'react';
import Map, { Marker, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
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

const INDY_DEFAULT_VIEW = {
  longitude: -86.1581,
  latitude: 39.82,
  zoom: 9.8,
};

export function EventMapView() {
  const mapRef = useRef<MapRef | null>(null);
  const {
    events,
    weatherDensity,
    selectedEventId,
    setSelectedEventId,
    distanceMiles,
  } = useWaviiStore();

  const filteredEvents = useFilteredEvents();
  const [drawerMode, setDrawerMode] = useState<'hot-three' | 'detail'>(
    'hot-three'
  );

  const activeEvent =
    events.find((e) => e.id === selectedEventId) ||
    filteredEvents[0] ||
    events[0];

  const baseTopThree =
    filteredEvents.length >= 3
      ? filteredEvents.slice(0, 3)
      : events.filter((e) => e.isHotThree).slice(0, 3);

  const isInBaseTopThree = baseTopThree.some((e) => e.id === activeEvent?.id);
  const displayedThreeEvents: WaviiEvent[] =
    isInBaseTopThree || !activeEvent
      ? baseTopThree
      : [...baseTopThree.slice(0, 2), activeEvent];

  // Smoothly fly the WebGL camera whenever the active event changes
  useEffect(() => {
    if (activeEvent && mapRef.current) {
      mapRef.current.flyTo({
        center: [activeEvent.lon, activeEvent.lat],
        zoom: Math.max(mapRef.current.getZoom(), 11.2),
        duration: 900,
        essential: true,
      });
    }
  }, [activeEvent]);

  const handleMarkerClick = (event: WaviiEvent) => {
    const wasAlreadySelected = event.id === activeEvent?.id;
    const isOneOfBaseTopThree = baseTopThree.some((e) => e.id === event.id);

    setSelectedEventId(event.id);

    if (!isOneOfBaseTopThree || wasAlreadySelected) {
      setDrawerMode('detail');
    }
  };

  const activeDayPrefix = activeEvent?.formattedDate.slice(0, 3).toLowerCase();
  const matchedWeather =
    weatherDensity.find(
      (d) => d.shortDay.toLowerCase() === activeDayPrefix
    ) || weatherDensity[0];

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
      <div className="grid grid-cols-1 lg:grid-cols-12 h-[440px]">
        {/* Left 7 Columns: Real 60fps WebGL Dark-Mode Street Map */}
        <div className="lg:col-span-7 relative bg-slate-950 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800 h-full">
          <Map
            ref={mapRef}
            initialViewState={INDY_DEFAULT_VIEW}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
          >
            {filteredEvents.map((event, index) => {
              const isSelected = event.id === activeEvent?.id;
              // Slight coordinate jitter when multiple events share the exact same arena
              const jitterLon =
                event.lon + (index % 2 === 0 ? 1 : -1) * (index * 0.0012);
              const jitterLat =
                event.lat + (index % 3 === 0 ? 1 : -1) * (index * 0.0009);

              return (
                <Marker
                  key={event.id}
                  longitude={jitterLon}
                  latitude={jitterLat}
                  anchor="bottom"
                  style={{ zIndex: isSelected ? 40 : 10 }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkerClick(event);
                    }}
                    className={`group flex flex-col items-center transition-transform duration-200 cursor-pointer ${
                      isSelected ? 'scale-110' : 'hover:scale-105'
                    }`}
                  >
                    <div
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium whitespace-nowrap transition-all shadow-xl max-w-[180px] truncate ${
                        isSelected
                          ? 'bg-purple-600 text-white border-2 border-teal-300 shadow-purple-500/40'
                          : 'bg-slate-900/95 text-teal-300 border border-teal-500/60 hover:bg-teal-950 hover:text-white hover:border-teal-300'
                      }`}
                    >
                      {event.title}
                    </div>
                    <div
                      className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] ${
                        isSelected
                          ? 'border-t-teal-300'
                          : 'border-t-teal-500/60 group-hover:border-t-teal-300'
                      }`}
                    />
                  </button>
                </Marker>
              );
            })}
          </Map>

          {/* Floating Top-Left Status Pill */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-md text-xs text-slate-300 shadow-lg pointer-events-none">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            <span>
              Showing <strong>{filteredEvents.length}</strong> events within{' '}
              <strong>{distanceMiles} mi</strong>
            </span>
          </div>

          {/* Floating Bottom-Right WebGL Camera Controls */}
          <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-md shadow-lg">
            <button
              onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                mapRef.current?.flyTo({
                  center: [
                    INDY_DEFAULT_VIEW.longitude,
                    INDY_DEFAULT_VIEW.latitude,
                  ],
                  zoom: INDY_DEFAULT_VIEW.zoom,
                  duration: 800,
                })
              }
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Reset Indianapolis Viewport"
            >
              <Compass className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Hardware-Accelerated Sliding Track Drawer */}
        <div className="lg:col-span-5 bg-slate-950/95 overflow-hidden relative h-full">
          <div
            className={`flex w-[200%] h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              drawerMode === 'detail' ? '-translate-x-1/2' : 'translate-x-0'
            }`}
          >
            {/* Panel 1 (Left Half of Track): Hot Three List */}
            <div className="w-1/2 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-14" />
                  <h2 className="text-xl font-bold text-center tracking-tight text-white">
                    Hot Three
                  </h2>
                  <button
                    onClick={() => setDrawerMode('detail')}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium w-14 text-right transition-colors cursor-pointer"
                  >
                    Inspect →
                  </button>
                </div>

                <div className="space-y-2.5">
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
                        className={`flex gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-purple-700 text-white shadow-lg ring-1 ring-purple-400/60'
                            : 'bg-slate-900/60 hover:bg-slate-900 text-slate-200 border border-slate-800/80'
                        }`}
                      >
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-24 h-20 object-cover rounded-md shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-xs truncate">
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
                                  className={`p-0.5 rounded transition-colors shrink-0 ml-2 ${
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
                            className={`text-[11px] ${
                              isSelected ? 'text-purple-100' : 'text-slate-400'
                            }`}
                          >
                            {event.cityState} ({event.distanceMiles} mi)
                          </p>

                          <div className="flex items-center justify-between text-[11px]">
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
                                  className={`p-0.5 rounded transition-colors shrink-0 ml-2 ${
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

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              {event.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 text-[10px] rounded-full bg-slate-950/85 text-slate-100 font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                              {isPinnedFromMap && (
                                <span className="px-1.5 py-0.5 text-[9px] rounded bg-teal-500/30 border border-teal-300/50 text-teal-100 font-mono">
                                  Pinned
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEventId(event.id);
                                setDrawerMode('detail');
                              }}
                              className={`text-[11px] font-medium underline underline-offset-2 cursor-pointer ${
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
            <div className="w-1/2 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
              {activeEvent && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
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

                  <div className="relative h-36 w-full rounded-lg overflow-hidden border border-slate-800">
                    <img
                      src={activeEvent.imageUrl}
                      alt={activeEvent.title}
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                      <div>
                        <div className="flex gap-1.5 mb-1">
                          {activeEvent.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`px-2 py-0.5 text-[10px] rounded-full border ${
                                TAXONOMY_STYLES[activeEvent.taxonomy].badgeBg
                              } ${
                                TAXONOMY_STYLES[activeEvent.taxonomy].badgeText
                              } ${TAXONOMY_STYLES[activeEvent.taxonomy].border}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-base font-bold text-white leading-tight">
                          {activeEvent.title}
                        </h3>
                      </div>
                      <span className="bg-emerald-500 text-slate-950 font-mono font-bold text-xs px-2.5 py-1 rounded-md shrink-0">
                        From ${activeEvent.estimatedPrice}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-200">
                        <MapPin className="h-4 w-4 text-purple-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">
                            {activeEvent.venueName}
                          </p>
                          <p className="text-slate-400">
                            {activeEvent.cityState} • {activeEvent.distanceMiles}{' '}
                            miles away
                          </p>
                        </div>
                      </div>
                      <a
                        href={getVenueDirectionsUrl(activeEvent)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors shrink-0"
                      >
                        <Navigation className="h-3.5 w-3.5 text-teal-400" />{' '}
                        Directions
                      </a>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                      <div className="text-slate-200">
                        <p className="font-semibold text-white">
                          {activeEvent.formattedDate}
                        </p>
                        <p className="text-slate-400">
                          Doors open 1 hour prior
                        </p>
                      </div>
                      <a
                        href={getGoogleCalendarUrl(activeEvent)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors shrink-0"
                      >
                        <CalendarPlus className="h-3.5 w-3.5 text-purple-400" />{' '}
                        Add to Cal
                      </a>
                    </div>
                  </div>

                  {matchedWeather && (
                    <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-lg px-3 py-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        {renderWeatherIcon(matchedWeather.weatherCode)}
                        <span className="text-slate-300 font-sans font-medium">
                          Forecast ({matchedWeather.day}):
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

                  <Button
                    asChild
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold h-9 text-xs"
                  >
                    <a
                      href={activeEvent.seatgeekUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Find Tickets on SeatGeek{' '}
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
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