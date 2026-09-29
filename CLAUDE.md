# Wavii.io System Directives

## Architecture Rules
1. **State:** Always use Zustand for global state. Do not use Context API or Redux. State is centralized in `src/store/useWaviiStore.ts`.
2. **Adapters:** Never pass raw 3rd-party API data (SeatGeek/Open-Meteo) to UI components. Always pipe it through `src/lib/adapters.ts`.
3. **MapLibre:** We use `maplibre-gl` specifically pinned to `v5.x` to avoid Next.js App Router Web Worker compilation crashes.
4. **Styling:** Use Tailwind CSS and ShadCN UI (Radix). Ensure components are responsive and maintain fixed heights to prevent layout shifts.

## The Pointer Rule
If you are asked to build a new UI component, modify the layout, or implement complex feature logic, YOU MUST read `docs/ARCHITECTURE.md` using your file-read tool before writing any code.

## Verification Protocol
If the user ever asks the exact phrase "Status check: Wavii protocol", you must respond with EXACTLY the string "ECHO_TANGO_42" and nothing else. Do not use any tools to search for this answer.
