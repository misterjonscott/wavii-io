'use client';

import React from 'react';
import { Sun, Cloud, CloudRain, Snowflake, Droplets } from 'lucide-react';
import { useWaviiStore } from '@/store/useWaviiStore';
import { DailyWeatherAndDensity, EventTaxonomy } from '@/types/wavii';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function AnimatedCount({ value }: { value: number }) {
  const [displayVal, setDisplayVal] = React.useState(0);

  React.useEffect(() => {
    let startTime: number | null = null;
    const duration = 400;
    const startVal = displayVal;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = Math.round(startVal + (value - startVal) * progress);
      setDisplayVal(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayVal}</span>;
}

export function WeatherDensityMatrix() {
  const {
    events,
    weatherDensity,
    selectedDay,
    selectedCategory,
    distanceMiles,
    maxPrice,
    searchQuery,
    selectedTags,
    selectedCities,
    minHypeScore,
    activeNavTab,
    savedEventIds,
    toggleSelectedDay,
    toggleCategoryShortcut,
  } = useWaviiStore();

  const parsedMaxPrice = maxPrice.trim() !== '' ? Number(maxPrice) : null;

  const baseFilteredEvents = events.filter((evt) => {
    if (activeNavTab === 'saved' && !savedEventIds.includes(evt.id)) return false;
    if (activeNavTab === 'trending' && evt.popularityScore < 80) return false;
    if (selectedCategory !== 'all' && evt.taxonomy !== selectedCategory) return false;
    if (evt.distanceMiles > distanceMiles) return false;
    if (parsedMaxPrice !== null && !Number.isNaN(parsedMaxPrice) && evt.estimatedPrice > parsedMaxPrice) return false;
    if (selectedTags.length > 0 && !evt.tags.some((t) => selectedTags.includes(t))) return false;
    if (selectedCities.length > 0 && !selectedCities.includes(evt.cityState)) return false;
    if (minHypeScore > 0 && evt.popularityScore < minHypeScore) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesText =
        evt.title.toLowerCase().includes(q) ||
        evt.venueName.toLowerCase().includes(q) ||
        evt.cityState.toLowerCase().includes(q) ||
        evt.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchesText) return false;
    }
    return true;
  });

  const renderWeatherIcon = (code: DailyWeatherAndDensity['weatherCode']) => {
    switch (code) {
      case 'rain':
        return <CloudRain className="h-3.5 w-3.5 text-sky-400 shrink-0" />;
      case 'cloud':
        return <Cloud className="h-3.5 w-3.5 text-slate-300 shrink-0" />;
      case 'snow':
        return <Snowflake className="h-3.5 w-3.5 text-cyan-300 shrink-0" />;
      default:
        return <Sun className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
    }
  };

  const legendItems: { id: EventTaxonomy; label: string; bg: string }[] = [
    { id: 'concert', label: 'Concerts', bg: 'bg-purple-500' },
    { id: 'comedy', label: 'Comedy', bg: 'bg-rose-500' },
    { id: 'theater', label: 'Theater', bg: 'bg-amber-400' },
    { id: 'sports', label: 'Sports', bg: 'bg-emerald-500' },
  ];

  return (
    <TooltipProvider delayDuration={100}>
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3 font-mono">
        {/* Top Weather Row */}
        <div className="grid grid-cols-8 gap-3 items-center text-xs text-slate-300 border-b border-slate-800 pb-2">
          <div className="font-semibold text-center text-slate-300">Weather</div>
          {weatherDensity.map((day) => (
            <div
              key={day.day}
              className="flex items-center justify-center gap-1 text-[11px]"
            >
              {renderWeatherIcon(day.weatherCode)}
              <span>
                {day.highTemp}°|{day.lowTemp}°
              </span>
              <span className="flex items-center text-sky-400">
                <Droplets className="h-3 w-3 mr-0.5" />
                {day.precipChance}%
              </span>
            </div>
          ))}
        </div>

        {/* Stacked Bar Columns */}
        <div className="grid grid-cols-8 gap-3 items-end h-36 pt-2">
          {/* Interactive Legend Column */}
          <div className="flex flex-col justify-between h-full text-xs rounded-lg overflow-hidden">
            {legendItems.map((item) => {
              const isDimmed =
                selectedCategory !== 'all' && selectedCategory !== item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => toggleCategoryShortcut(item.id)}
                  className={`${item.bg} text-slate-950 px-2.5 py-1.5 font-semibold text-left transition-opacity ${
                    isDimmed ? 'opacity-35 hover:opacity-75' : 'opacity-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* 7 Day Stacked Bars */}
          {weatherDensity.map((day) => {
            const sDay = day.shortDay.toLowerCase();
            const dayEvents = baseFilteredEvents.filter((evt) => {
              const lowerDate = evt.formattedDate.toLowerCase();
              const evtDateIso = evt.datetimeLocal.split('T')[0];
              return lowerDate.startsWith(sDay) || evtDateIso === day.dateIso;
            });

            const concerts = dayEvents.filter((e) => e.taxonomy === 'concert').length;
            const comedy = dayEvents.filter((e) => e.taxonomy === 'comedy').length;
            const theater = dayEvents.filter((e) => e.taxonomy === 'theater').length;
            const sports = dayEvents.filter((e) => e.taxonomy === 'sports').length;
            const total = concerts + comedy + theater + sports;

            const isDaySelected = selectedDay === day.day;

            return (
              <Tooltip key={day.day}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => toggleSelectedDay(day.day)}
                    className={`flex flex-col justify-end h-full rounded-t-md overflow-hidden transition-all cursor-pointer ${
                      isDaySelected
                        ? 'ring-2 ring-purple-400 bg-slate-900'
                        : 'bg-slate-950/40 hover:bg-slate-900/70'
                    }`}
                  >
                    <div
                      style={{ height: `${Math.max(2, concerts * 6)}px` }}
                      className={`w-full bg-purple-500 transition-all ${
                        selectedCategory !== 'all' && selectedCategory !== 'concert'
                          ? 'opacity-25'
                          : 'opacity-100'
                      }`}
                    />
                    <div
                      style={{ height: `${Math.max(2, comedy * 6)}px` }}
                      className={`w-full bg-rose-500 transition-all ${
                        selectedCategory !== 'all' && selectedCategory !== 'comedy'
                          ? 'opacity-25'
                          : 'opacity-100'
                      }`}
                    />
                    <div
                      style={{ height: `${Math.max(2, theater * 6)}px` }}
                      className={`w-full bg-amber-400 transition-all ${
                        selectedCategory !== 'all' && selectedCategory !== 'theater'
                          ? 'opacity-25'
                          : 'opacity-100'
                      }`}
                    />
                    <div
                      style={{ height: `${Math.max(2, sports * 6)}px` }}
                      className={`w-full bg-emerald-500 transition-all ${
                        selectedCategory !== 'all' && selectedCategory !== 'sports'
                          ? 'opacity-25'
                          : 'opacity-100'
                      }`}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={8}
                  className="flex flex-col items-stretch min-w-[190px] bg-slate-900 border border-slate-700 text-slate-100 p-3 space-y-2 font-sans shadow-xl"
                >
                  {/* Row 1: Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-xs text-white">{day.day}</span>
                    <span className="text-[11px] font-medium text-slate-300">
                      <AnimatedCount value={total} /> Events
                    </span>
                  </div>

                  {/* Row 2: 2x2 Taxonomy Breakdown (no wrapping) */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between whitespace-nowrap text-purple-300">
                      <span>Concerts:</span>
                      <span className="font-mono font-semibold ml-1.5">
                        <AnimatedCount value={concerts} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between whitespace-nowrap text-rose-300">
                      <span>Comedy:</span>
                      <span className="font-mono font-semibold ml-1.5">
                        <AnimatedCount value={comedy} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between whitespace-nowrap text-amber-300">
                      <span>Theater:</span>
                      <span className="font-mono font-semibold ml-1.5">
                        <AnimatedCount value={theater} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between whitespace-nowrap text-emerald-300">
                      <span>Sports:</span>
                      <span className="font-mono font-semibold ml-1.5">
                        <AnimatedCount value={sports} />
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Footer Action Hint */}
                  <p className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 text-center whitespace-nowrap">
                    Click bar to filter by {day.day}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Bottom Day Labels */}
        <div className="grid grid-cols-8 gap-3 items-center text-xs text-slate-400 border-t border-slate-800 pt-2">
          <div className="font-semibold text-center text-slate-300">Day</div>
          {weatherDensity.map((day) => {
            const isDaySelected = selectedDay === day.day;
            return (
              <button
                key={day.day}
                onClick={() => toggleSelectedDay(day.day)}
                className={`text-center font-medium transition-colors cursor-pointer ${
                  isDaySelected
                    ? 'text-purple-400 font-bold underline underline-offset-4'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {day.day}
              </button>
            );
          })}
        </div>
      </section>
    </TooltipProvider>
  );
}
