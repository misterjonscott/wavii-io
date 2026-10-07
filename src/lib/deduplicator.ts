import { WaviiEvent } from '@/types/wavii';

/**
 * Generates a consistent hash for an event based on its date, venue, and title.
 * This hash is used for deduplication.
 * @param event The WaviiEvent to hash.
 * @returns A string hash in the format YYYY-MM-DD-normalizedVenue-normalizedTitle.
 */
function generateEventHash(event: WaviiEvent): string {
  const date = event.datetimeLocal.split('T')[0]; // YYYY-MM-DD
  const normalizeString = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, '');

  const normalizedVenue = normalizeString(event.venueName);
  const normalizedTitle = normalizeString(event.title);

  return `${date}-${normalizedVenue}-${normalizedTitle}`;
}

/**
 * Merges a list of WaviiEvents, deduplicating based on a generated hash.
 * When events are merged, the source is set to 'mixed', ticketing options are combined,
 * and an image may be applied if the existing event is missing one.
 * @param events An array of WaviiEvent objects.
 * @returns A deduplicated array of WaviiEvent objects.
 */
export function mergeEvents(events: WaviiEvent[]): WaviiEvent[] {
  const deduplicatedEvents = new Map<string, WaviiEvent>();

  for (const event of events) {
    const hash = generateEventHash(event);

    if (deduplicatedEvents.has(hash)) {
      const existingEvent = deduplicatedEvents.get(hash)!;

      // Set source to 'mixed' if it's not already
      if (existingEvent.source !== 'mixed') {
        existingEvent.source = 'mixed';
      }

      // Append ticketingOptions, ensuring no duplicates
      for (const newOption of event.ticketingOptions) {
        if (
          !existingEvent.ticketingOptions.some(
            (opt) => opt.url === newOption.url
          )
        ) {
          existingEvent.ticketingOptions.push(newOption);
        }
      }

      // If existing event is missing an image and current event has one, apply it
      if (!existingEvent.imageUrl && event.imageUrl) {
        existingEvent.imageUrl = event.imageUrl;
        existingEvent.imageAttribution = event.imageAttribution;
      }
    } else {
      deduplicatedEvents.set(hash, { ...event }); // Add a clone to avoid modifying original references later
    }
  }

  return Array.from(deduplicatedEvents.values());
}
