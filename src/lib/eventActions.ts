import { WaviiEvent } from '@/types/wavii';

/**
 * Generates a Google Maps Directions URL to the event venue
 */
export function getVenueDirectionsUrl(event: WaviiEvent): string {
  const destination = encodeURIComponent(
    `${event.venueName}, ${event.cityState}`
  );
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

/**
 * Generates a pre-populated Google Calendar event creation URL
 */
export function getGoogleCalendarUrl(event: WaviiEvent): string {
  const startDate = new Date(event.datetimeLocal);
  // Default event duration: 3 hours
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const formatGCalDate = (date: Date) =>
    date.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const dates = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;
  const text = encodeURIComponent(event.title);
  const location = encodeURIComponent(`${event.venueName}, ${event.cityState}`);
  const details = encodeURIComponent(
    `Live ${event.taxonomy} event at ${event.venueName}. Tickets & info: ${event.seatgeekUrl}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&location=${location}&details=${details}`;
}