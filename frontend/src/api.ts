import type { NewPlace, Place } from './types';

const API = import.meta.env.VITE_API_URL ?? '/api';
const CACHE = 'rf-cache';

export const km = (a: number, b: number, c: number, d: number) => {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

export function clientId(): string {
  let id = localStorage.getItem('rf-client');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('rf-client', id); }
  return id;
}

function readCache(): Place[] {
  try { return JSON.parse(localStorage.getItem(CACHE) ?? '[]'); } catch { return []; }
}
function writeCache(fresh: Place[]) {
  const map = new Map(readCache().map((p) => [p.id, p]));
  fresh.forEach((p) => map.set(p.id, p));
  try { localStorage.setItem(CACHE, JSON.stringify([...map.values()].slice(-5000))); } catch { /* storage full */ }
}

/** Online: ask the API and remember the result. Offline/failed: use what is saved on this device. */
export async function searchPlaces(lat: number, lon: number, radius: number) {
  try {
    const res = await fetch(`${API}/places?lat=${lat}&lon=${lon}&radius=${radius}`);
    if (!res.ok) throw new Error('Server error');
    const places: Place[] = await res.json();
    writeCache(places);
    return { places, offline: false };
  } catch {
    const places = readCache()
      .map((p) => ({ ...p, distance: +km(lat, lon, p.lat, p.lon).toFixed(2) }))
      .filter((p) => p.distance! <= radius)
      .sort((a, b) => a.distance! - b.distance!);
    return { places, offline: true };
  }
}

export async function addPlace(p: NewPlace): Promise<Place> {
  const res = await fetch(`${API}/places`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...p, clientId: clientId() }),
  });
  if (!res.ok) throw new Error('Could not save. Check your connection and try again.');
  return res.json();
}

export async function confirmPlace(id: string): Promise<Place> {
  const res = await fetch(`${API}/places/${id}/confirm`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: clientId() }),
  });
  if (!res.ok) throw new Error('Could not confirm.');
  return res.json();
}
