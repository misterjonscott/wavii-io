'use client';

import React, { useRef, useState, useEffect } from 'react';
import Map, { MapRef, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import useSupercluster from 'use-supercluster';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Heart,
  Navigation,
  CalendarPlus,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Compass,
  MapPin,
  Droplets,
  ArrowLeft,
} from 'lucide-react';
import { useWaviiStore, useFilteredEvents } from '@/store/useWaviiStore';
import { WaviiEvent } from '@/types/wavii';
import { TAXONOMY_STYLES } from '@/data/mockData';
import { getEnvironmentalTags } from '@/lib/adapters';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const INDY_DEFAULT_VIEW = {
  longitude: -86.1581,
  latitude: 39.7684,
  zoom: 9.8,
};

function getGoogleCalendarUrl(event: WaviiEvent): string {
  const title = encodeURIComponent(event.title);
  const location = encodeURIComponent(`${event.venueName}, ${event.cityState}`);
  const details = encodeURIComponent(`Find tickets and details on Wavii.io: ${event.seatgeekUrl}`);
  const start = event.datetimeLocal.replace(/[-:]/g, '');
  const endDt = new Date(new Date(event.datetimeLocal).getTime() + 3 * 3600 * 1000);
  const end = endDt.toISOString().replace(/[-:]/g, '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${location}&details=${details}`;
}

function getVenueDirectionsUrl(event: WaviiEvent): string {
  const dest = encodeURIComponent(`${event.venueName} ${event.cityState}`);
  return `https://www.google.com/maps/search/?api=1&query=${dest}`;
}

export function EventMapView() {
  const mapRef = useRef<MapRef | null>(null);
  const {
    events,
    weatherDensity,
    selectedEventId,
    setSelectedEventId,
    drawerMode,
    setDrawerMode,
    spiderfiedCluster,
    setSpiderfiedCluster,
    clearSpiderfiedCluster,
    distanceMiles,
    savedEventIds,
    toggleSaveEvent,
    originLat,
    originLon,
    detectedCity,
  } = useWaviiStore();

  const filteredEvents = useFilteredEvents();

  const [zoom, setZoom] = useState(INDY_DEFAULT_VIEW.zoom);
  const [bounds, setBounds] = useState<[number, number, number, number]>([
    -86.8, 39.5, -85.5, 40.2,
  ]);

  const updateMapBounds = () => {
    if (mapRef.current) {
      const b = mapRef.current.getBounds();
      if (b) {
        setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      }
      setZoom(mapRef.current.getZoom());
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      updateMapBounds();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const points = filteredEvents.map((event) => {
    return {
      type: 'Feature' as const,
      properties: {
        cluster: false,
        eventId: event.id,
        event,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [event.lon, event.lat],
      },
    };
  });

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: Math.floor(zoom),
    options: { radius: 60, maxZoom: 18 },
  });

  const activeEvent =
    events.find((e) => e.id === selectedEventId) ||
    filteredEvents[0] ||
    events[0];

  // Smoothly fly the WebGL camera whenever the active event changes
  useEffect(() => {
    if (activeEvent && mapRef.current) {
      mapRef.current.flyTo({
        center: [activeEvent.lon, activeEvent.lat],
        zoom: 14,
        duration: 900,
        essential: true,
      });
    }
  }, [selectedEventId, activeEvent]);

  const handleMarkerClick = (event: WaviiEvent) => {
    setSelectedEventId(event.id);
    setDrawerMode('detail');
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

  const isSavedActive = activeEvent ? savedEventIds.includes(activeEvent.id) : false;

  return (
    <TooltipProvider delayDuration={120}>
      <div
        className="grid grid-cols-1 lg:grid-cols-12 h-[440px]"
        onClick={() => clearSpiderfiedCluster()}
      >
        {/* Left 7 Columns: Real 60fps WebGL Dark-Mode Street Map */}
        <div className="lg:col-span-7 relative bg-surface-dark overflow-hidden border-b lg:border-b-0 lg:border-r border-border-muted h-full">
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: originLon,
              latitude: originLat,
              zoom: 9.8,
            }}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
            onLoad={updateMapBounds}
            onMove={updateMapBounds}
          >
            {clusters.map((cluster) => {
              const [longitude, latitude] = cluster.geometry.coordinates;
              const { cluster: isCluster, point_count: pointCount } = cluster.properties;

              if (isCluster) {
                const isSpiderfied = spiderfiedCluster?.clusterId === cluster.id;
                return (
                  <React.Fragment key={`cluster-group-${cluster.id}`}>
                    <Marker
                      longitude={longitude}
                      latitude={latitude}
                      anchor="center"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (supercluster) {
                            const expansionZoom = supercluster.getClusterExpansionZoom(cluster.id);
                            const maxZoom = 20;
                            if (zoom >= maxZoom || expansionZoom >= maxZoom || expansionZoom > 18) {
                              const leaves = supercluster.getLeaves(cluster.id, Infinity);
                              const leavesEvents = leaves.map(
                                (l) => l.properties.event as WaviiEvent
                              );
                              setSpiderfiedCluster({
                                clusterId: cluster.id,
                                leaves: leavesEvents,
                                coordinates: [longitude, latitude],
                              });
                            } else {
                              clearSpiderfiedCluster();
                              mapRef.current?.flyTo({
                                center: [longitude, latitude],
                                zoom: Math.min(expansionZoom, maxZoom),
                                duration: 600,
                                essential: true,
                              });
                            }
                          }
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-purple-600 text-white border-2 border-teal-300 shadow-xl shadow-purple-500/40 hover:scale-110 transition-transform cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="h-3 w-3 text-teal-300" />
                        <span>{pointCount} Events</span>
                      </button>
                    </Marker>

                    {isSpiderfied &&
                      spiderfiedCluster &&
                      spiderfiedCluster.leaves.map((event, index, arr) => {
                        const angle = (index / arr.length) * 2 * Math.PI;
                        const radius = 110;
                        const isSelected = event.id === activeEvent?.id;

                        return (
                          <Marker
                            key={`spider-${event.id}`}
                            longitude={longitude}
                            latitude={latitude}
                            anchor="bottom"
                          >
                            <motion.div
                              initial={{ opacity: 0, x: 0, y: 0 }}
                              animate={{
                                opacity: 1,
                                x: Math.cos(angle) * radius,
                                y: Math.sin(angle) * radius,
                              }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
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
                                      : 'bg-surface-card/95 text-teal-300 border border-teal-500/60 hover:bg-teal-950 hover:text-white hover:border-teal-300'
                                  }`}
                                >
                                  {event.title}
                                </div>
                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-teal-500/60" />
                              </button>
                            </motion.div>
                          </Marker>
                        );
                      })}
                  </React.Fragment>
                );
              }

              const event = cluster.properties.event as WaviiEvent;
              const isSelected = event.id === activeEvent?.id;

              return (
                <Marker
                  key={`event-${event.id}`}
                  longitude={longitude}
                  latitude={latitude}
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
                          : 'bg-surface-card/95 text-teal-300 border border-teal-500/60 hover:bg-teal-950 hover:text-white hover:border-teal-300'
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
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-surface-card/90 backdrop-blur-md border border-border-muted px-3 py-1.5 rounded-md text-xs text-slate-300 shadow-lg pointer-events-none">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            <span>
              <strong>{detectedCity}</strong> • Showing{' '}
              <strong>{filteredEvents.length}</strong> events within{' '}
              <strong>{distanceMiles} mi</strong>
            </span>
          </div>

          {/* Floating Bottom-Right WebGL Camera Controls */}
          <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1 bg-surface-card/90 backdrop-blur-md border border-border-muted p-1 rounded-md shadow-lg">
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
                    originLon,
                    originLat,
                  ],
                  zoom: 9.8,
                  duration: 800,
                })
              }
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Reset Viewport"
            >
              <Compass className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Hardware-Accelerated Sliding Track Drawer */}
        <div className="lg:col-span-5 bg-surface-dark/95 overflow-hidden relative h-full">
          <div
            className={`flex w-[200%] h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              drawerMode === 'detail' ? '-translate-x-1/2' : 'translate-x-0'
            }`}
          >
            {/* Panel 1 (Left Half of Track): Filtered Events List */}
            <div className="w-1/2 flex flex-col justify-between shrink-0 overflow-y-auto">
              <div className="space-y-2.5">
                {filteredEvents.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-2">
                    <p className="text-xs font-semibold text-slate-200">
                      No events match your active filters
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Try clearing active filters or adjusting radius.
                    </p>
                  </div>
                ) : (
                  filteredEvents.map((event) => {
                    const isSelected = event.id === activeEvent?.id;
                    const isSaved = savedEventIds.includes(event.id);
                    const style = TAXONOMY_STYLES[event.taxonomy];

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
                            : 'bg-surface-card/60 hover:bg-surface-card text-slate-200 border border-border-muted/80'
                        }`}
                      >
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-24 h-20 object-cover rounded-md shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h3 className="font-bold text-xs truncate">
                                {event.title}
                              </h3>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSaveEvent(event.id);
                                    }}
                                    className={`inline-flex items-center justify-center h-5 w-5 rounded-full border transition-colors cursor-pointer shrink-0 ${
                                      isSaved
                                        ? 'border-rose-500/80 bg-rose-500/20 text-rose-400'
                                        : isSelected
                                        ? 'border-purple-400/60 text-purple-200 hover:text-white'
                                        : 'border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50'
                                    }`}
                                  >
                                    <Heart
                                      className={`h-2.5 w-2.5 ${
                                        isSaved ? 'fill-rose-400' : ''
                                      }`}
                                    />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-surface-card border border-slate-700 text-slate-100 text-xs">
                                  {isSaved ? 'Remove from Saved' : 'Save Event'}
                                </TooltipContent>
                              </Tooltip>
                            </div>
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
                              <TooltipContent className="bg-surface-card border border-slate-700 text-slate-100 text-xs">
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
                              <TooltipContent className="bg-surface-card border border-slate-700 text-slate-100 text-xs">
                                Add to Google Calendar
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {event.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className={`px-2 py-0.5 text-[10px] rounded border ${style.badgeBg} ${style.badgeText} ${style.border} font-medium`}
                                >
                                  {tag}
                                </span>
                              ))}
                              {getEnvironmentalTags(event, weatherDensity).map((badge) => (
                                <span
                                  key={badge.type}
                                  className={`px-1.5 py-0.5 text-[9px] rounded border ${badge.colorClass} font-medium`}
                                >
                                  {badge.label}
                                </span>
                              ))}
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
                  })
                )}
              </div>

            </div>

            {/* Panel 2 (Right Half of Track): Selected Event Detail Drawer */}
            <div className="w-1/2 flex flex-col justify-between shrink-0 overflow-y-auto">
              {activeEvent && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-border-muted pb-2.5">
                    <button
                      onClick={() => setDrawerMode('hot-three')}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Explore Events
                    </button>
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-purple-400">
                      <Sparkles className="h-3.5 w-3.5" /> Hype Score:{' '}
                      {activeEvent.popularityScore}/100
                    </span>
                  </div>

                  <div className="relative h-36 w-full rounded-lg overflow-hidden border border-border-muted">
                    <img
                      src={activeEvent.imageUrl}
                      alt={activeEvent.title}
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                      <div>
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          {activeEvent.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`px-2 py-0.5 text-[10px] rounded border ${
                                TAXONOMY_STYLES[activeEvent.taxonomy].badgeBg
                              } ${
                                TAXONOMY_STYLES[activeEvent.taxonomy].badgeText
                              } ${TAXONOMY_STYLES[activeEvent.taxonomy].border}`}
                            >
                              {tag}
                            </span>
                          ))}
                          {getEnvironmentalTags(activeEvent, weatherDensity).map((badge) => (
                            <span
                              key={badge.type}
                              className={`px-2 py-0.5 text-[10px] rounded border ${badge.colorClass} font-medium`}
                            >
                              {badge.label}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white leading-tight">
                            {activeEvent.title}
                          </h3>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSaveEvent(activeEvent.id);
                                }}
                                className={`inline-flex items-center justify-center h-6 w-6 rounded-full border transition-colors cursor-pointer shrink-0 ${
                                  isSavedActive
                                    ? 'border-rose-500/80 bg-rose-500/20 text-rose-400'
                                    : 'border-slate-700 bg-surface-card/80 text-slate-300 hover:text-rose-400 hover:border-rose-500/50'
                                }`}
                              >
                                <Heart
                                  className={`h-3 w-3 ${
                                    isSavedActive ? 'fill-rose-400' : ''
                                  }`}
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-surface-card border border-slate-700 text-slate-100 text-xs">
                              {isSavedActive ? 'Remove from Saved' : 'Save Event'}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <span className="bg-emerald-500 text-slate-950 font-mono font-bold text-xs px-2.5 py-1 rounded-md shrink-0">
                        From ${activeEvent.estimatedPrice}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-card/90 border border-border-muted rounded-lg p-3 space-y-2 text-xs">
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

                    <div className="flex items-center justify-between border-t border-border-muted pt-2">
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
                    <div className="flex items-center justify-between bg-surface-card/60 border border-border-muted/80 rounded-lg px-3 py-2 text-xs font-mono">
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
