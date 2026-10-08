import React, { useRef, useEffect } from 'react';
import { Car, Utensils, MapPin, Star, Navigation } from 'lucide-react';
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

interface EventLogisticsProps {
  activeEvent: WaviiEvent;
  isPlannerOpen: boolean;
  plannerTab: 'parking' | 'dining';
  placesData: { parking: Place[]; dining: Place[] };
  setPlannerOpen: (isOpen: boolean) => void;
  setPlannerTab: (tab: 'parking' | 'dining') => void;
  setPlacesData: (tab: 'parking' | 'dining', results: Place[]) => void; // setPlacesData prop
  selectedParking: Place | null;
  selectedDining: Place | null;
  setSelectedParking: (place: Place | null) => void;
  setSelectedDining: (place: Place | null) => void;
}

// Helper function for distance calculation - moved from EventDetail.tsx
function getMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

export function EventLogistics({
  activeEvent,
  isPlannerOpen,
  plannerTab,
  placesData,
  setPlannerTab,
  setPlacesData, // Destructure setPlacesData
  selectedParking,
  selectedDining,
  setSelectedParking,
  setSelectedDining,
}: EventLogisticsProps) {
  const plannerRef = useRef<HTMLDivElement | null>(null);
  const fetchedForEvent = useRef<{ eventId: number | null; parking: boolean; dining: boolean }>({
    eventId: null,
    parking: false,
    dining: false,
  });

  useEffect(() => {
    if (isPlannerOpen && plannerRef.current) {
      plannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isPlannerOpen, plannerTab]);

  useEffect(() => {
    if (!activeEvent) return;
    if (fetchedForEvent.current.eventId !== activeEvent.id) {
      fetchedForEvent.current = { eventId: activeEvent.id, parking: false, dining: false };
    }
    if (isPlannerOpen && !fetchedForEvent.current[plannerTab]) {
      fetchedForEvent.current[plannerTab] = true;

      fetch(`/api/places?lat=${activeEvent.lat}&lon=${activeEvent.lon}&type=${plannerTab === 'dining' ? 'restaurant' : 'parking'}`)
        .then((res) => res.json())
        .then((data) => {
          const results = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
          setPlacesData(plannerTab, results);
        })
        .catch((err) => console.error('Places fetch error:', err));
    }
  }, [isPlannerOpen, plannerTab, activeEvent, setPlacesData]);

  return (
    <div ref={plannerRef} className="w-full mt-8 pt-8 border-t border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {plannerTab === 'parking' ? <Car className="h-5 w-5 text-purple-400" /> : <Utensils className="h-5 w-5 text-teal-400" />}
          {plannerTab === 'parking' ? 'Parking Near Venue' : 'Food & Drink Near Venue'}
        </h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={plannerTab === 'parking' ? 'default' : 'outline'}
            onClick={() => setPlannerTab('parking')}
            className={`${plannerTab === 'parking' ? 'bg-purple-600 text-white' : 'border-slate-700 text-slate-300'} cursor-pointer`}
          >
            Parking
          </Button>
          <Button
            size="sm"
            variant={plannerTab === 'dining' ? 'default' : 'outline'}
            onClick={() => setPlannerTab('dining')}
            className={`${plannerTab === 'dining' ? 'bg-purple-600 text-white' : 'border-slate-700 text-slate-300'} cursor-pointer`}
          >
            Dining
          </Button>
        </div>
      </div>

      {placesData[plannerTab] && placesData[plannerTab].length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {placesData[plannerTab]
            .filter((place) => {
              const name = place.displayName?.text || '';
              return !/private|permit|reserved/i.test(name);
            })
            .map((place, index) => (
            <div
              key={place.id || place.place_id || index}
              className={`p-4 rounded-xl border border-slate-800 bg-slate-900/90 text-left flex flex-col justify-between hover:border-slate-700 transition-colors shadow-lg ${
                (selectedParking?.googleMapsUri === place.googleMapsUri || selectedDining?.googleMapsUri === place.googleMapsUri)
                  ? 'ring-2 ring-emerald-500' : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white text-base leading-snug line-clamp-1" title={place.displayName?.text}>
                    {place.displayName?.text}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                  {place.rating !== undefined ? (
                    <>
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{place.rating}</span>
                      {place.userRatingCount !== undefined && (
                        <span className="text-slate-400">({place.userRatingCount.toLocaleString()})</span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400">No ratings yet</span>
                  )}
                </div>
                {place.formattedAddress && (
                  <p className="text-xs text-slate-400 flex items-start gap-1 line-clamp-1" title={place.formattedAddress}>
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>{place.formattedAddress}</span>
                  </p>
                )}
                {place.location?.latitude !== undefined && place.location?.longitude !== undefined && (
                  <p className="text-xs text-slate-400">
                    {getMiles(
                      activeEvent?.lat,
                      activeEvent?.lon,
                      place.location.latitude,
                      place.location.longitude
                    )}{' '}
                    miles away
                  </p>
                )}
              </div>
              <div className="pt-4 mt-2 border-t border-slate-800/80">
                <a
                  href={
                    place.location?.latitude !== undefined && place.location?.longitude !== undefined
                      ? `https://www.google.com/maps/dir/?api=1&origin=${place.location.latitude},${place.location.longitude}&destination=${activeEvent?.lat},${activeEvent?.lon}&travelmode=walking`
                      : place.googleMapsUri || '#'
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors border border-slate-700"
                >
                  <Navigation className="h-3.5 w-3.5 text-teal-400" /> Walking Directions
                </a>
              </div>
              <div className="mt-2">
                <Button size="sm" className={`w-full ${
                    (plannerTab === 'parking' && selectedParking?.googleMapsUri === place.googleMapsUri) ||
                    (plannerTab === 'dining' && selectedDining?.googleMapsUri === place.googleMapsUri)
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-purple-600 hover:bg-purple-500'
                  } text-white font-semibold h-8 text-xs shadow-lg shadow-purple-900/30 cursor-pointer`}
                  onClick={() => {
                    if (plannerTab === 'parking') {
                      if (selectedParking?.googleMapsUri === place.googleMapsUri) {
                        setSelectedParking(null);
                      } else {
                        setSelectedParking(place);
                      }
                    } else {
                      if (selectedDining?.googleMapsUri === place.googleMapsUri) {
                        setSelectedDining(null);
                        } else {
                           setSelectedDining(place);
                         }
                       }
                     }}
                >
                  {
                    (plannerTab === 'parking' && selectedParking?.googleMapsUri === place.googleMapsUri) ||
                    (plannerTab === 'dining' && selectedDining?.googleMapsUri === place.googleMapsUri)
                      ? 'Remove from Plan'
                      : selectedParking || selectedDining ? 'Add to my plan' : 'Make a plan'
                  }
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-400">
          <p className="text-sm font-medium">
            No {plannerTab === 'parking' ? 'parking options' : 'dining spots'} found nearby.
          </p>
        </div>
      )}
    </div>
  );
}
