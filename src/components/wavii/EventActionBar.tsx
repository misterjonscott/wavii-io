import React, { useState } from 'react';
import { ExternalLink, Car, Utensils } from 'lucide-react';
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
}

export function EventActionBar({ activeEvent, selectedParking, selectedDining }: EventActionBarProps) {
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
    <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-700 p-4 z-50 flex items-center justify-between">
      <div className="flex flex-col text-sm text-slate-300">
        <span className="font-semibold text-white">Your Itinerary:</span>
        {activeEvent && (
          <span className="flex items-center gap-1.5 mt-1">
            <ExternalLink className="h-4 w-4 text-purple-400" /> {activeEvent.title}
          </span>
        )}
        {selectedParking && (
          <span className="flex items-center gap-1.5 mt-1">
            <Car className="h-4 w-4 text-purple-400" /> {selectedParking.displayName?.text}
          </span>
        )}
        {selectedDining && (
          <span className="flex items-center gap-1.5 mt-1">
            <Utensils className="h-4 w-4 text-teal-400" /> {selectedDining.displayName?.text}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleCopyAgenda}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
        >
          Copy Agenda
        </Button>
        <Button
          onClick={handleShareLink}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
        >
          Share Link
        </Button>
        <div className="relative">
          <Button
            onClick={() => setShowCalendarMenu(!showCalendarMenu)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
          >
            Save to Calendar
          </Button>
          {showCalendarMenu && (
            <div className="absolute bottom-full mb-2 right-0 w-48 bg-slate-800 rounded-lg shadow-lg z-10 border border-slate-700 p-1">
              <button
                onClick={handleGoogleCalendar}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded-md block"
              >
                Google Calendar
              </button>
              <button
                onClick={handleAppleCalendar}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded-md block mt-1"
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
