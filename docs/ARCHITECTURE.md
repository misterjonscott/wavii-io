# Wavii.io — System Architecture & Deep Context

## 1. Core Architectural Patterns
- **The Adapter Pattern (`src/lib/adapters.ts`):** We never let raw third-party JSON bleed into the UI. Normalize messy SeatGeek payloads into strict `WaviiEvent` objects, apply intelligent taxonomy mapping, and handle duplicate/missing performer images using deterministic taxonomy-based fallbacks.
- **Zero-Config Server Proxy (`src/app/api/events/route.ts`):** The SeatGeek API is proxied through a Next.js server route to keep the `SEATGEEK_CLIENT_ID` secure. It gracefully falls back to `MOCK_EVENTS` if the API key is missing.
- **Centralized Reactive Store (`src/store/useWaviiStore.ts`):** Zustand controls all global state. `useFilteredEvents()` applies an 8-layer waterfall filter locally. Uses `persist` middleware for saving bookmarked events.

## 2. UI/UX Engineering Specs (Crucial)
- **Zero Layout Shift (`EventDataTable.tsx`):** The table container is locked to `h-[440px]`. If there are 0 results, an empty state centers inside the container. If there are 1-3 results, the rows do not stretch. 
- **Interactive Tags:** Clicking a genre/tag or city inside the table row instantly adds it as a filter token to the active store.
- **Hardware-Accelerated Drawer (`EventMapView.tsx`):** The "Hot Three" / "Detail" panels sit side-by-side inside a `w-[200%]` track. Toggling the view applies a `translate-x` with a `cubic-bezier` easing function for a physical sliding effect without unmounting DOM nodes.
- **Smart Facets (`TokenizedFilterBar.tsx`):** A dynamic UI component that translates active Zustand states into removable `[Facet: Value x]` pill tokens.
- **Weather Matrix (`WeatherDensityMatrix.tsx`):** Tooltips are forced into `flex-col` to properly stack the Header, 2x2 Grid, and Footer without breaking the layout.

## 3. Advanced UX & Data Patterns
- **Graceful Geolocation Degradation:** The app attempts to use `navigator.geolocation` on load. If the user allows it, coordinates update dynamically and reverse-geocode to the most common city in the SeatGeek payload. If blocked or missing, it gracefully falls back to Indianapolis without breaking the UI.
- **The Developer Console (Transparency Pattern):** Technical reviewers can click the `LIVE` header badges to inspect the global Zustand state and see the Adapter Pattern in action via a split-pane raw/sanitized JSON view.
- **Map Clustering (`use-supercluster`):** We use `use-supercluster` rather than MapLibre's native GeoJSON layers. This allows us to group dense events into numbered cluster markers while preserving our ability to render highly styled React/Tailwind markers for individual events.