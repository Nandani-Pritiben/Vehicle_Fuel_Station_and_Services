# Roadside Finder (React + TypeScript, NestJS + TypeScript)

Finds petrol / diesel / CNG stations, EV chargers, garages and puncture shops from OpenStreetMap.
No API keys or credit card needed.

    roadside-finder/
      backend/   NestJS API  (port 3000)
      frontend/  React + Vite (port 5173)

## 1. Create the free Supabase database (5 minutes)
1. Sign up at supabase.com (no card needed) and click New project. Save the database password.
2. Open SQL Editor -> New query, paste everything from `backend/supabase/schema.sql`, click Run.
   This enables PostGIS and creates the `user_places` and `place_votes` tables.
3. Click Connect (top of the dashboard), choose "Session pooler", copy the connection string.
   Use the pooler string, not the "Direct connection": direct is IPv6-only and fails on many home networks.
4. In `backend/`, copy `.env.example` to `.env` and paste the string as DATABASE_URL
   (replace [YOUR-PASSWORD] with your real password).

## 2. Run it (needs Node.js 18 or newer - nodejs.org)

Terminal 1 - API:

    cd backend
    npm install
    npm run dev

Terminal 2 - website:

    cd frontend
    npm install
    npm run dev

Open http://localhost:5173 and press "Use my location".
Add a place, then check Supabase -> Table Editor -> user_places: your row is there.

## API
- GET  /api/places?lat&lon&radius   places near a point (OSM + user-added), sorted by distance
- POST /api/places                  add a place {name,type,lat,lon,phone,hours,fuels,clientId}
- POST /api/places/:id/confirm      "it is here" vote; 3 other users make it verified

## How it works
- The backend asks the free Overpass API for OSM data, caches each area for 1 hour, and merges user-added places.
- User-added places and votes are stored in Supabase Postgres. Nearby search uses PostGIS (ST_DWithin on a GIST index).
- If Supabase is unreachable, the API still returns OpenStreetMap results.
- The frontend saves every result in the browser. If the API or internet is unreachable it lists saved places by GPS distance.

## Deploy for free
- Backend: Render or Railway. Build `npm install && npm run build`, start `npm run prod`.
  Add DATABASE_URL as an environment variable on the host (never commit .env).
- Frontend: Vercel or Netlify. Root `frontend`, build `npm run build`, output `dist`,
  env var VITE_API_URL=https://your-backend-url/api
- Then restrict CORS in backend/src/main.ts to your frontend URL.

## Known limits
- OSM lacks many small puncture shops and phone numbers; unconfirmed fuel types are labelled.
- Offline here means saved place data. Offline map images and turn-by-turn need a mobile app (Capacitor/Flutter + MapLibre + Valhalla).
- Row Level Security is ON with no public policies, so the Supabase REST API cannot read these tables; only your NestJS server can.
- No login or rate limiting yet; add both before a public launch. Supabase free projects pause after a week of inactivity.
