'use client';

import React, { useRef, useEffect } from 'react';
import Map, { MapRef, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useWaviiStore } from '@/store/useWaviiStore';

export function EventMap() {
  const mapRef = useRef<MapRef | null>(null);
  const { events, selectedEventId } = useWaviiStore();

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const lat = selectedEvent ? selectedEvent.lat : 39.7684;
  const lon = selectedEvent ? selectedEvent.lon : -86.1581;

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 14,
        duration: 800,
        essential: true,
      });
    }
  }, [lat, lon]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative border border-border-muted bg-surface-dark">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: lon,
          latitude: lat,
          zoom: 14,
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <Marker longitude={lon} latitude={lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-mono font-bold shadow-lg border border-teal-300">
              {selectedEvent?.venueName || 'Venue'}
            </div>
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-purple-600" />
          </div>
        </Marker>
      </Map>
    </div>
  );
}
