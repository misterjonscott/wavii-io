# Wavii.io — Spatial Live Event & Weather Discovery Dashboard

A dark-mode spatial discovery application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **ShadCN UI (Radix Primitives)**, and **Zustand**. Designed and engineered from Figma concepts to production React architecture.

## Key Architectural Highlights

- **Multi-API Adapter Architecture (`src/lib/adapters.ts`):** Decouples raw third-party payloads (**SeatGeek v2 API** & **Open-Meteo 7-Day Weather API**) from strict internal UI interfaces (`WaviiEvent` and `DailyWeatherAndDensity`).
- **Centralized Reactive Store (`src/store/useWaviiStore.ts`):** Powered by Zustand with derived selector hooks (`useFilteredEvents`) enabling instant cross-filtering across the Command Bar, Category Cards, Data Table, Spatial Map, and 7-Day Weather Matrix.
- **Hardware-Accelerated Spatial Map & Sliding Drawer (`src/components/wavii/EventMapView.tsx`):** Synchronizes geographic venue pins with a dual-panel `cubic-bezier` sliding drawer that cross-references each event's date with the live local weather forecast.
- **Zero-Config Resilience (`/api/events`):** Server-side Next.js Route Handler protects `SEATGEEK_CLIENT_ID` credentials while gracefully falling back to a rich Central Indiana dataset when running in demo or CI environments.

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configure environment variables (optional):
   ```bash
   cp .env.example .env.local
   ```
   *Note: **Open-Meteo** live weather hydration requires no API key and runs out of the box across all environments. Add `SEATGEEK_CLIENT_ID` in `.env.local` (local) or your host's environment settings (staging/production) to switch from the built-in Central Indiana dataset to live SeatGeek API data.*

3. Start the development server:
   ```bash
   pnpm dev
   ```
