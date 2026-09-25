# RoadReady — Fuel/EV Finder Frontend

React + TypeScript frontend for the **Roadside Assistance & Fuel/EV Finder App**.

Locates fuel stations, EV chargers, puncture shops, and garages within a user-defined radius,
filtered by fuel type, vehicle type, and brand — built as an offline-first, network-independent
experience (see `src/utils/haversine.ts` for the local distance calculation used instead of a
network-dependent maps API).

## Tech Stack

- React 18 + TypeScript
- Vite
- No external UI libraries — hand-built design system (see `src/styles/index.css`)

## Getting Started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Project Structure

```
src/
├── components/
│   ├── FilterBar.tsx     # Search + category/fuel/vehicle filters
│   ├── StationCard.tsx   # Result list item
│   ├── MapView.tsx       # Lightweight SVG map (swap for a real map SDK in production)
│   └── DetailPanel.tsx   # Selected station detail view
├── data/
│   └── mockStations.ts   # Sample data matching the Stations / Fuel_EV_Details / Services schema
├── utils/
│   └── haversine.ts      # Offline geospatial distance calculation
├── types.ts              # Shared TypeScript types
├── App.tsx               # App shell, filtering logic, state
└── main.tsx               # Entry point
```

## Data Model

Mirrors the project's proposed schema:
- **Stations** — core station info (name, brand, category, location)
- **Fuel_EV_Details** — fuel types, vehicle compatibility, EV connector info
- **Services** — puncture/garage services, wait times, crowdsourced ratings

In production, this data would come from the backend API (aggregating OpenStreetMap Overpass API,
Open Charge Map API, and crowdsourced input) rather than the local mock data used here for the UI build.

## Next Steps

- Replace `MapView`'s SVG placeholder with a real map SDK (e.g. MapLibre GL, Google Maps)
- Wire `App.tsx` to a live API instead of `mockStations.ts`
- Add the offline SQLite sync layer described in the project plan
