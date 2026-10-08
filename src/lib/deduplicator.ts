import { WaviiEvent } from '@/types/wavii';

/**
 * Generates a consistent hash for an event based on its date, venue, and title.
 * This hash is used for deduplication.
 * @param event The WaviiEvent to hash.
 * @returns A string hash in the format YYYY-MM-DD-normalizedVenue-normalizedTitle.
 */
function generateEventHash(event: WaviiEvent): string {
  const date = event.datetimeLocal.split('T')[0]; // YYYY-MM-DD
  const noiseWords = [
    'the', 'at', 'center', 'arena', 'stadium', 'theatre', 'theater',
    'fieldhouse', 'music', 'amphitheatre', 'amphitheater', 'pavilion',
    'hall', 'club', 'stage',
  ];

  const normalizeVenue = (venueName: string) => {
    let normalized = venueName.toLowerCase();
    for (const word of noiseWords) {
      normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
    }
    normalized = normalized.replace(/[^a-z0-9]/g, '');
    return normalized.substring(0, 12);
  };

  const venueKey = normalizeVenue(event.venueName);
  const normalizedTitle = event.title.toLowerCase().replace(/[^a-z0-9]/g, ''); // Keep original title normalization for now

  return `${date}-${venueKey}-${normalizedTitle}`;
}

/**
 * Merges a list of WaviiEvents, deduplicating based on a generated hash.
 * When events are merged, the source is set to 'mixed', ticketing options are combined,
 * and an image may be applied if the existing event is missing one.
 * @param events An array of WaviiEvent objects.
 * @returns A deduplicated array of WaviiEvent objects.
 */
export function mergeEvents(events: WaviiEvent[]): WaviiEvent[] {
  const noiseWords = [
    'the', 'at', 'center', 'arena', 'stadium', 'theatre', 'theater',
    'fieldhouse', 'music', 'amphitheatre', 'amphitheater', 'pavilion',
    'hall', 'club', 'stage',
  ];
  const significantWordsToIgnore = [
    'tour', 'live', 'tickets', 'presents', 'show', 'with',
  ];

  const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const getSignificantWords = (title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .filter(word => word.length >= 4 && !significantWordsToIgnore.includes(word));
  };

  const normalizeVenue = (venueName: string) => {
    let normalized = venueName.toLowerCase();
    for (const word of noiseWords) {
      normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
    }
    normalized = normalized.replace(/[^a-z0-9]/g, '');
    return normalized.substring(0, 12);
  };

  const deduplicatedEvents = new Map<string, WaviiEvent>();
  const eventGroups = new Map<string, WaviiEvent[]>();

  for (const event of events) {
    const date = event.datetimeLocal.split('T')[0];
    const venueKey = normalizeVenue(event.venueName);
    const groupKey = `${date}-${venueKey}`;

    if (!eventGroups.has(groupKey)) {
      eventGroups.set(groupKey, []);
    }
    eventGroups.get(groupKey)!.push(event);
  }

  for (const [groupKey, candidates] of eventGroups.entries()) {
    if (candidates.length === 0) continue;

    const canonicalEvent = { ...candidates[0] }; // Clone the first event to be the canonical one

    for (let i = 1; i < candidates.length; i++) {
      const candidateEvent = candidates[i];

      const canonicalTitleWords = getSignificantWords(canonicalEvent.title);
      const candidateTitleWords = getSignificantWords(candidateEvent.title);

      const titlesShareSignificantWord = canonicalTitleWords.some(canonicalWord =>
        candidateTitleWords.includes(canonicalWord)
      );

      const canonicalStartTime = new Date(canonicalEvent.datetimeLocal).getTime();
      const candidateStartTime = new Date(candidateEvent.datetimeLocal).getTime();
      const timeDifference = Math.abs(canonicalStartTime - candidateStartTime) / (1000 * 60 * 60); // Difference in hours

      const sameVenueOnSameDay = (
        canonicalEvent.venueName === candidateEvent.venueName &&
        canonicalEvent.datetimeLocal.split('T')[0] === candidateEvent.datetimeLocal.split('T')[0]
      );

      if (titlesShareSignificantWord || (timeDifference <= 2 && sameVenueOnSameDay)) {
        // Merge logic
        // 1. Set source to 'mixed'
        canonicalEvent.source = 'mixed';
        // Boost popularity score when an event is cross-listed on both primary & resale platforms
        canonicalEvent.popularityScore = Math.min(
          99,
          Math.max(canonicalEvent.popularityScore, candidateEvent.popularityScore) + 12
        );

        // 2. Merge ticketingOptions
        for (const newOption of candidateEvent.ticketingOptions) {
          if (!canonicalEvent.ticketingOptions.some(opt => opt.url === newOption.url)) {
            canonicalEvent.ticketingOptions.push(newOption);
          }
        }

        // 3. Prefer 'family' taxonomy
        if (candidateEvent.taxonomy === 'family' && canonicalEvent.taxonomy !== 'family') {
          canonicalEvent.taxonomy = 'family';
        }

        // 4. Prefer incoming imageUrl if existing is fallback or missing
        const isFallbackImage = (url: string) => url.includes('fallback') || url === ''; // Assuming 'fallback' in URL or empty string indicates a fallback
        if ((isFallbackImage(canonicalEvent.imageUrl) || !canonicalEvent.imageUrl) && candidateEvent.imageUrl) {
          canonicalEvent.imageUrl = candidateEvent.imageUrl;
          canonicalEvent.imageAttribution = candidateEvent.imageAttribution;
        }
      }
    }
    deduplicatedEvents.set(canonicalEvent.id.toString(), canonicalEvent); // Use event ID as key for final map
  }

  return Array.from(deduplicatedEvents.values());
}
