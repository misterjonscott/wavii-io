import React, { useState } from 'react';
import { ExternalLink, Car, Utensils, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WaviiEvent } from '@/types/wavii';

interface Place {
  id?: string;
  place_id?: string;
  displayName?: { text: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
}

interface EventActionBarProps {
  activeEvent: WaviiEvent;
  selectedParking: Place | null;
  selectedDining: Place | null;
  onRemoveParking: () => void;
  onRemoveDining: () => void;
  onClearItinerary: () => void;
  onSelectTab?: (tab: 'parking' | 'dining') => void;
  onSelectEvent?: () => void;
}

export function EventActionBar({
  activeEvent,
  selectedParking,
  selectedDining,
  onRemoveParking,
  onRemoveDining,
  onClearItinerary,
  onSelectTab,
  onSelectEvent,
}: EventActionBarProps) {
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);

  const handleCopyAgenda = () => {
    if (!activeEvent) return;

    let agendaText = `🎟️ ${activeEvent.title}\n`;
    if (selectedParking) {
      agendaText += `🚗 Parking: ${selectedParking.displayName?.text}\n`;
    }
    if (selectedDining) {
      agendaText += `🍔 Food & Drink: ${selectedDining.displayName?.text}\n`;
    }

    navigator.clipboard.writeText(agendaText);
    alert("Agenda copied to clipboard!");
  };

  const handleAppleCalendar = () => {
    if (!activeEvent) return;

    const eventStartDate = new Date(activeEvent.datetimeLocal);
    const eventEndDate = new Date(eventStartDate.getTime() + 3 * 60 * 60 * 1000);

    const formatDateTimeForICS = (date: Date) => {
      return date.toISOString().replace(/[-:]|\.\d{3}/g, '').slice(0, -1) + 'Z';
    };

    const dtstart = formatDateTimeForICS(eventStartDate);
    const dtend = formatDateTimeForICS(eventEndDate);

    const summary = activeEvent.title;

    let location = activeEvent.venueName;
    if (selectedParking?.formattedAddress) {
      location = selectedParking.formattedAddress;
    } else {
      location = `${activeEvent.venueName}, ${activeEvent.cityState}`;
    }

    let description = `Event Title: ${activeEvent.title}\nVenue: ${activeEvent.venueName}`;
    if (selectedParking?.displayName?.text) {
      description += `\nParking: ${selectedParking.displayName.text}`;
    }
    if (selectedDining?.displayName?.text) {
      description += `\nDining: ${selectedDining.displayName.text}`;
    }
    description += `\nFind tickets and details on Wavii.io: ${activeEvent.ticketingOptions[0]?.url || ''}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Wavii//NONSGML v1.0//EN',
      'BEGIN:VEVENT',
      `UID:${activeEvent.id}@wavii.io`,
      `DTSTAMP:${formatDateTimeForICS(new Date())}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wavii-itinerary.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowCalendarMenu(false);
  };

  const handleGoogleCalendar = () => {
    if (!activeEvent) return;

    const eventStartDate = new Date(activeEvent.datetimeLocal);
    const eventEndDate = new Date(eventStartDate.getTime() + 3 * 60 * 60 * 1000);

    const formatDateTimeForGoogle = (date: Date) => {
      return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
    };

    const dtstart = formatDateTimeForGoogle(eventStartDate);
    const dtend = formatDateTimeForGoogle(eventEndDate);

    const title = encodeURIComponent(activeEvent.title);
    
    let location = activeEvent.venueName;
    if (selectedParking?.formattedAddress) {
      location = selectedParking.formattedAddress;
    } else {
      location = `${activeEvent.venueName}, ${activeEvent.cityState}`;
    }
    const encodedLocation = encodeURIComponent(location);

    const details = encodeURIComponent(`Find tickets and details on Wavii.io: ${activeEvent.ticketingOptions[0]?.url || ''}`);

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dtstart}/${dtend}&location=${encodedLocation}&details=${details}`;
    
    window.open(googleCalendarUrl, '_blank');
    setShowCalendarMenu(false);
  };

  const handleShareLink = () => {
    if (!activeEvent) return;

    const payload = {
      eventTitle: activeEvent.title,
      eventDate: activeEvent.formattedDate,
      venueName: activeEvent.venueName,
      ticketUrl: activeEvent.ticketingOptions[0]?.url || '',
      ...(selectedParking && {
        parkingName: selectedParking.displayName?.text,
        parkingAddress: selectedParking.formattedAddress,
        parkingUrl: selectedParking.googleMapsUri,
      }),
      ...(selectedDining && {
        diningName: selectedDining.displayName?.text,
        diningAddress: selectedDining.formattedAddress,
        diningUrl: selectedDining.googleMapsUri,
      }),
    };

    const shareUrl = `${window.location.origin}/plan?data=${encodeURIComponent(btoa(encodeURIComponent(JSON.stringify(payload))))}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Share link copied!");
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-700 p-3 md:px-6 md:py-3.5 z-50 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xl">
      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-200">
        <span className="font-bold text-white mr-1">Your Itinerary:</span>
        {activeEvent && (
          <button
            type="button"
            onClick={onSelectEvent}
            title="Jump to event details"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-medium transition-colors cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span className="truncate max-w-44 sm:max-w-60">{activeEvent.title}</span>
          </button>
        )}
        {selectedParking && (
          <div
            onClick={() => onSelectTab?.('parking')}
            title="Click to change parking selection"
            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/40 text-purple-200 transition-colors cursor-pointer"
          >
            <Car className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span className="truncate max-w-36 sm:max-w-48">{selectedParking.displayName?.text}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveParking();
              }}
              title="Remove Parking"
              className="ml-0.5 p-0.5 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {selectedDining && (
          <div
            onClick={() => onSelectTab?.('dining')}
            title="Click to change dining selection"
            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-teal-950/60 hover:bg-teal-900/70 border border-teal-500/40 text-teal-200 transition-colors cursor-pointer"
          >
            <Utensils className="h-3.5 w-3.5 text-teal-400 shrink-0" />
            <span className="truncate max-w-36 sm:max-w-48">{selectedDining.displayName?.text}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveDining();
              }}
              title="Remove Dining"
              className="ml-0.5 p-0.5 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={onClearItinerary}
          className="bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-semibold h-8 px-3 text-xs cursor-pointer"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear Itinerary
        </Button>
        <Button
          size="sm"
          onClick={handleCopyAgenda}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-8 px-3 text-xs rounded-lg shadow-md cursor-pointer"
        >
          Copy Agenda
        </Button>
        <Button
          size="sm"
          onClick={handleShareLink}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold h-8 px-3 text-xs rounded-lg shadow-md cursor-pointer"
        >
          Share Link
        </Button>
        <div className="relative">
          <Button
            size="sm"
            onClick={() => setShowCalendarMenu(!showCalendarMenu)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold h-8 px-3 text-xs rounded-lg shadow-md cursor-pointer"
          >
            Save to Calendar
          </Button>
          {showCalendarMenu && (
            <div className="absolute bottom-full mb-2 right-0 w-48 bg-slate-800 rounded-lg shadow-lg z-10 border border-slate-700 p-1">
              <button
                onClick={handleGoogleCalendar}
                className="w-full text-left px-3 py-2 text-xs text-white hover:bg-slate-700 rounded-md block cursor-pointer"
              >
                Google Calendar
              </button>
              <button
                onClick={handleAppleCalendar}
                className="w-full text-left px-3 py-2 text-xs text-white hover:bg-slate-700 rounded-md block mt-1 cursor-pointer"
              >
                Apple / Outlook
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
