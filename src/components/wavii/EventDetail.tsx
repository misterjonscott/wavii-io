'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  MapPin,
  CalendarPlus,
  ExternalLink,
  Heart,
  Navigation, // Re-added Navigation for getVenueDirectionsUrl used below.
} from 'lucide-react';
import { useWaviiStore } from '@/store/useWaviiStore';
import { WaviiEvent } from '@/types/wavii';
import { TAXONOMY_STYLES } from '@/data/mockData';
import { getEnvironmentalTags } from '@/lib/adapters';
import { Button } from '@/components/ui/button';
import { EventMap } from '@/components/wavii/EventMap';
import { EventActionBar } from '@/components/wavii/EventActionBar';
import { EventLogistics } from '@/components/wavii/EventLogistics';

// This helper function is now exclusively used within EventDetail.tsx, so it remains here.
function getVenueDirectionsUrl(event: WaviiEvent): string {
  const dest = encodeURIComponent(`${event.venueName} ${event.cityState}`);
  return `https://www.google.com/maps/search/?api=1&query=${dest}`;
}

export function EventDetail() {
  const {
    events,
    selectedEventId,
    setSelectedEventId,
    savedEventIds,
    toggleSaveEvent,
    weatherDensity,
    isPlannerOpen,
    plannerTab,
    placesData,
    setPlannerOpen,
    setPlannerTab,
    setPlacesData, // setPlacesData is still needed here for fetching places in EventDetail.
    selectedParking,
    selectedDining,
    setSelectedParking,
    setSelectedDining,
  } = useWaviiStore();
  const activeEvent = events.find((e) => e.id === selectedEventId);

  // The plannerRef and fetchedTabs are now local to EventLogistics, no longer needed here.
  // The useEffect for fetching places data is also moved to EventLogistics.

  const [weatherData, setWeatherData] = useState<{
    tempMax: number;
    tempMin: number;
    precip: number;
    sunset: string;
  } | null>(null);
  const [weatherDataError, setWeatherDataError] = useState<string | null>(null);
  const [fetchedEventId, setFetchedEventId] = useState<number | null>(null);

  const now = new Date();
  const eventDateObj = activeEvent ? new Date(activeEvent.datetimeLocal) : now;
  const diffTime = eventDateObj.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isBeyond14Days = diffDays > 14;

  const weatherLoading = activeEvent ? fetchedEventId !== activeEvent.id && !isBeyond14Days : false;

  useEffect(() => {
    if (!activeEvent || isBeyond14Days) return;
    if (fetchedEventId === activeEvent.id) return;

    const eventDate = activeEvent.datetimeLocal.split('T')[0];
    const { lat, lon } = activeEvent;
    let isMounted = true;

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${eventDate}&end_date=${eventDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunset&temperature_unit=fahrenheit&timezone=auto`
    )
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data && data.daily) {
          const max = data.daily.temperature_2m_max?.[0] ?? 70;
          const min = data.daily.temperature_2m_min?.[0] ?? 50;
          const precip = data.daily.precipitation_probability_max?.[0] ?? 0;
          const sunsetRaw = data.daily.sunset?.[0];
          let sunsetTime = '7:30 PM';
          if (sunsetRaw) {
            const dateObj = new Date(sunsetRaw);
            sunsetTime = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          }
          setWeatherData({ tempMax: Math.round(max), tempMin: Math.round(min), precip, sunset: sunsetTime });
          setWeatherDataError(null);
          setFetchedEventId(activeEvent.id);
        } else {
          throw new Error('Invalid data structure');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to fetch weather:', err);
        setWeatherData(null);
        setWeatherDataError('Weather data unavailable');
        setFetchedEventId(activeEvent.id);
      });

    return () => {
      isMounted = false;
    };
  }, [activeEvent, fetchedEventId, isBeyond14Days]);

  if (!activeEvent) return null;

  const isSavedActive = savedEventIds.includes(activeEvent.id);

  return (
    <div className='relative rounded-xl border border-border-muted bg-surface-card/95 p-6 w-full shadow-2xl'>
      {/* Absolute top-right close 'X' button */}
      <button
        onClick={() => {
          setSelectedEventId(null);
        }}
        className='absolute top-4 right-4 z-20 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700'
        title='Close'
      >
        <X className='h-4 w-4' />
      </button>

      {/* 3-Column CSS Grid Layout */}
      <div className='grid grid-cols-1 md:grid-cols-12 gap-6 w-full'>
        {/* Left Column (Visuals - col-span-4) */}
        <div className='w-full aspect-square md:h-full md:col-span-4 relative rounded-lg overflow-hidden border border-border-muted'>
          <Image
            src={activeEvent.imageUrl}
            alt={activeEvent.title}
            fill
            className='w-full h-full object-cover'
          />
          <div className='absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent' />
          <span className='absolute top-3 right-3 bg-emerald-500 text-slate-950 font-mono font-bold text-xs px-3 py-1 rounded-md shadow-lg'>
            From ${activeEvent.estimatedPrice}
          </span>
        </div>

        {/* Center Column (Core Info - col-span-5) */}
        <div className='md:col-span-5 flex flex-col justify-between space-y-4'>
          <div className='space-y-3'>
            {/* Top: Event Title (h1) */}
            <div className='flex items-start justify-between gap-3 pr-8'>
              <h1 className='text-xl md:text-2xl font-bold text-white leading-tight'>
                {activeEvent.title}
              </h1>
              <button
                onClick={() => toggleSaveEvent(activeEvent.id)}
                className={`inline-flex items-center justify-center h-8 w-8 rounded-full border transition-colors cursor-pointer shrink-0 ${
                  isSavedActive
                    ? 'border-rose-500/80 bg-rose-500/20 text-rose-400'
                    : 'border-slate-700 bg-surface-card text-slate-300 hover:text-rose-400 hover:border-rose-500/50'
                }`}
                title={isSavedActive ? 'Remove from Saved' : 'Save Event'}
              >
                <Heart className={`h-4 w-4 ${isSavedActive ? 'fill-rose-400' : ''}`} />
              </button>
            </div>

            {/* Directly below title: Tag pills (Genre, Type, AQI) */}
            <div className='flex flex-wrap gap-1.5'>
              {activeEvent.tags.map((tag) => (
                <span
                  key={tag}
                  className={`px-2 py-0.5 text-xs rounded border ${
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
                  className={`px-2 py-0.5 text-xs rounded border ${badge.colorClass} font-medium`}
                >
                  {badge.label}
                </span>
              ))}
            </div>

            {/* Middle: Venue location text and Date/Time layout */}
            <div className='space-y-3 pt-2 text-xs md:text-sm'>
              <div className='flex items-start gap-2.5 text-slate-200'>
                <MapPin className='h-4 w-4 text-purple-400 shrink-0 mt-0.5' />
                <div>
                  <p className='font-semibold text-white'>
                    {activeEvent.venueName}
                  </p>
                  <p className='text-slate-400'>
                    {activeEvent.cityState} • {activeEvent.distanceMiles} miles away
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-2.5 text-slate-200'>
                <CalendarPlus className='h-4 w-4 text-purple-400 shrink-0 mt-0.5' />
                <div>
                  <p className='font-semibold text-white'>
                    {activeEvent.formattedDate}
                  </p>
                  <p className='text-slate-400'>
                    Doors open 1 hour prior to event time
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Ticket buttons and secondary utility buttons */}
          <div className='pt-2'>
            <div className='flex flex-wrap gap-2'>
              {activeEvent.ticketingOptions.map((option, index) => {
                const isSeatGeek = option.source === 'seatgeek';
                const buttonText = `Tickets (${option.source === 'seatgeek' ? 'SeatGeek' : 'Ticketmaster'})`;
                const buttonClass = isSeatGeek
                  ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'; // Distinct blue for Ticketmaster
                return (
                  <Button
                    key={index}
                    asChild
                    className={`flex-1 min-w-37.5 ${buttonClass} text-white font-semibold h-10 text-sm shadow-lg cursor-pointer`}
                  >
                    <a href={option.url} target='_blank' rel='noreferrer'>
                      {buttonText} <ExternalLink className='ml-2 h-4 w-4' />
                    </a>
                  </Button>
                );
              })}
            </div>

            {/* Secondary Utility Buttons */}
            <div className='flex gap-4 w-full mt-4'>
              <Button
                variant='outline'
                className='flex-1 bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors h-10 text-sm cursor-pointer'
                onClick={() => {
                  setPlannerOpen(true);
                  setPlannerTab('parking');
                }}
              >
                <Navigation className='mr-2 h-4 w-4 text-purple-400' /> Directions
                Parking Nearby
              </Button>
              <Button
                variant='outline'
                className='flex-1 bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors h-10 text-sm cursor-pointer'
                onClick={() => {
                  setPlannerOpen(true);
                  setPlannerTab('dining');
                }}
              >
                <Navigation className='mr-2 h-4 w-4 text-teal-400' /> Directions
                Food & Drink
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column (Context & Utilities - col-span-3) */}
        <div className='md:col-span-3 flex flex-col justify-between space-y-4'>
          {/* Top: Embed EventMap with fixed height (e.g. h-48) and rounded corners */}
          <div className='h-48 w-full rounded-lg overflow-hidden border border-border-muted shrink-0'>
            <EventMap />
          </div>

          {/* Middle: Live Weather & Sunset Data Card */}
          <div className='flex-1 min-h-20 rounded-lg border border-border-muted bg-surface-card/90 p-3 flex flex-col justify-center text-xs'>
            {isBeyond14Days ? (
              <p className='text-xs text-slate-400 text-center font-medium'>
                Forecast available 14 days prior to event.
              </p>
            ) : weatherLoading ? (
              <div className='flex items-center justify-center space-x-2 py-3'>
                <div className='h-4 w-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin' />
                <span className='text-slate-400 text-xs'>Fetching live weather...</span>
              </div>
            ) : weatherDataError ? (
              <p className='text-xs text-slate-400 text-center font-medium'>
                {weatherDataError}
              </p>
            ) : weatherData ? (
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between text-slate-300 font-medium'>
                  <span className='flex items-center gap-1.5'>
                    🌡️ Temp: <strong className='text-white'>{weatherData.tempMax}° / {weatherData.tempMin}°</strong>
                  </span>
                  <span className='flex items-center gap-1 text-sky-400'>
                    💧 {weatherData.precip}%
                  </span>
                </div>
                <div className='flex items-center justify-between text-slate-300 font-medium border-t border-border-muted/60 pt-1.5'>
                  <span className='flex items-center gap-1.5'>
                    🌅 Sunset: <strong className='text-white'>{weatherData.sunset}</strong>
                  </span>
                  <span className='text-[10px] text-teal-400 font-mono'>Open-Meteo Live</span>
                </div>
              </div>
            ) : (
              <p className='text-xs text-slate-400 text-center'>Weather data unavailable</p>
            )}
          </div>

          {/* Bottom: Render utility buttons ("Directions") */}
          <div className='grid grid-cols-1 gap-2'>
            <a
              href={getVenueDirectionsUrl(activeEvent)}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors border border-slate-700'
            >
              <Navigation className='h-3.5 w-3.5 text-teal-400' /> Directions
            </a>
          </div>
        </div>
      </div>

      {isPlannerOpen && activeEvent && (
        <EventLogistics
          activeEvent={activeEvent}
          isPlannerOpen={isPlannerOpen}
          plannerTab={plannerTab}
          placesData={placesData}
          setPlannerOpen={setPlannerOpen}
          setPlannerTab={setPlannerTab}
          setPlacesData={setPlacesData}
          selectedParking={selectedParking}
          selectedDining={selectedDining}
          setSelectedParking={setSelectedParking}
          setSelectedDining={setSelectedDining}
        />
      )}

      {(selectedParking || selectedDining) && activeEvent && (
        <EventActionBar
          activeEvent={activeEvent}
          selectedParking={selectedParking}
          selectedDining={selectedDining}
        />
      )}
    </div>
  );
}
