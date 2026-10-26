import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { addPlace, confirmPlace, searchPlaces } from './api';
import type { Place, PlaceType } from './types';

type LL = [number, number];
const COLORS: Record<PlaceType, string> = { fuel: '#e8590c', ev: '#2b8a3e', garage: '#1c7ed6', puncture: '#862e9c' };
const LABEL: Record<PlaceType, string> = { fuel: 'Fuel', ev: 'EV charger', garage: 'Garage', puncture: 'Puncture / tyres' };
const FILTERS = ['petrol', 'diesel', 'cng', 'ev', 'garage', 'puncture'] as const;

function MapEvents({ onClick }: { onClick: (p: LL) => void }) {
  useMapEvents({ click: (e) => onClick([e.latlng.lat, e.latlng.lng]) });
  return null;
}
function MoveTo({ to, zoom }: { to: LL | null; zoom: number }) {
  const map = useMap();
  useEffect(() => { if (to) map.setView(to, zoom); }, [to, zoom, map]);
  return null;
}

export default function App() {
  const [pos, setPos] = useState<LL | null>(null);
  const [focus, setFocus] = useState<{ to: LL; zoom: number } | null>(null);
  const [radius, setRadius] = useState(5);
  const [vehicle, setVehicle] = useState('');
  const [brand, setBrand] = useState('');
  const [on, setOn] = useState<Set<string>>(new Set(FILTERS));
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState('Press “Use my location” to begin.');
  const [offline, setOffline] = useState(false);
  const [city, setCity] = useState('');
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<LL | null>(null);
  const [form, setForm] = useState({ name: '', type: 'puncture' as PlaceType, phone: '', hours: '', fuels: '' });

  const load = useCallback(async (p: LL, r: number) => {
    setStatus('Searching…');
    const res = await searchPlaces(p[0], p[1], r);
    setPlaces(res.places);
    setOffline(res.offline);
    setStatus(res.offline ? 'Offline: showing places saved on this device.' : '');
  }, []);

  useEffect(() => { if (pos) load(pos, radius); }, [pos, radius, load]);

  const locate = () => {
    setStatus('Getting GPS…');
    navigator.geolocation.getCurrentPosition(
      (g) => { const p: LL = [g.coords.latitude, g.coords.longitude]; setPos(p); setFocus({ to: p, zoom: 13 }); },
      () => setStatus('Location is blocked. Type a city or tap the map to set your position.'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const findCity = async () => {
    if (!city.trim()) return;
    try {
      const r = await (await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(city))).json();
      if (!r[0]) return setStatus('Place not found.');
      const p: LL = [+r[0].lat, +r[0].lon]; setPos(p); setFocus({ to: p, zoom: 13 });
    } catch { setStatus('City search needs internet.'); }
  };

  const onMapClick = (p: LL) => { if (adding) setDraft(p); else setPos(p); };

  const shown = useMemo(() => {
    const b = brand.trim().toLowerCase();
    return places.filter((p) => {
      const typeOk = p.type === 'fuel' ? p.fuels.some((f) => on.has(f)) : on.has(p.type);
      if (!typeOk) return false;
      if (vehicle && (p.type === 'garage' || p.type === 'puncture') && p.veh.length && !p.veh.includes(vehicle)) return false;
      if (b && !`${p.brand} ${p.name}`.toLowerCase().includes(b)) return false;
      return true;
    });
  }, [places, on, vehicle, brand]);

  const toggle = (k: string) => setOn((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const save = async () => {
    if (!draft || form.name.trim().length < 2) return setStatus('Tap the map to set the spot and enter a name.');
    try {
      const p = await addPlace({
        name: form.name, type: form.type, lat: draft[0], lon: draft[1], phone: form.phone, hours: form.hours,
        fuels: form.fuels.toLowerCase().split(/[,\s]+/).filter(Boolean),
      });
      setPlaces((x) => [p, ...x]); setAdding(false); setDraft(null);
      setForm({ name: '', type: 'puncture', phone: '', hours: '', fuels: '' });
      setStatus('Saved. Other users will see it as unverified.');
    } catch (e) { setStatus((e as Error).message); }
  };

  const confirm = async (id: string) => {
    try { const u = await confirmPlace(id); setPlaces((x) => x.map((p) => (p.id === id ? { ...p, ...u, distance: p.distance } : p))); }
    catch (e) { setStatus((e as Error).message); }
  };

  const share = (p: Place) => {
    const text = `${p.name}${p.phone ? ' – ' + p.phone : ''}\nhttps://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=17/${p.lat}/${p.lon}`;
    if (navigator.share) navigator.share({ title: p.name, text }).catch(() => {});
    else navigator.clipboard?.writeText(text).then(() => setStatus('Link copied.'));
  };
  const shareApp = () => {
    const d = { title: 'Roadside Finder', text: 'Find fuel, EV chargers, garages and puncture shops near you', url: location.href };
    if (navigator.share) navigator.share(d).catch(() => {});
    else navigator.clipboard?.writeText(location.href).then(() => setStatus('App link copied.'));
  };

  return (
    <div className="app">
      <header>
        <h1>Roadside Finder</h1>
        <span className={'net' + (offline ? ' off' : '')}>{offline ? 'offline' : 'online'}</span>
      </header>
      <main>
        <section className="panel">
          <div className="row">
            <button className="primary" onClick={locate}>Use my location</button>
            <input value={city} onChange={(e) => setCity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && findCity()} placeholder="or type a city" />
            <button onClick={findCity}>Search</button>
          </div>
          <div className="row">
            <label>Radius <select value={radius} onChange={(e) => setRadius(+e.target.value)}>
              {[2, 5, 10, 25, 50].map((r) => <option key={r}>{r}</option>)}</select> km</label>
            <label>Vehicle <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              <option value="">All</option><option value="2">2-wheeler</option><option value="4">4-wheeler</option><option value="h">Heavy</option></select></label>
          </div>
          <div className="chips">
            {FILTERS.map((f) => <label key={f}><input type="checkbox" checked={on.has(f)} onChange={() => toggle(f)} /> {f === 'cng' ? 'CNG / gas' : f === 'ev' ? 'EV charger' : f}</label>)}
          </div>
          <div className="row"><input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand: Indian Oil, Nayara, HP, Shell…" /></div>
          <div className="row small">
            <button onClick={() => { setAdding(!adding); setDraft(null); }}>{adding ? 'Cancel add' : 'Add a place'}</button>
            <button onClick={shareApp}>Share app</button>
          </div>

          {adding && (
            <div className="form">
              <p className="hint">{draft ? 'Spot chosen. Fill in the details.' : 'Tap the map to choose the spot.'}</p>
              <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PlaceType })}>
                {(Object.keys(LABEL) as PlaceType[]).map((t) => <option key={t} value={t}>{LABEL[t]}</option>)}</select>
              <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input placeholder="Hours, e.g. 24/7" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
              {form.type === 'fuel' && <input placeholder="Fuels: petrol, diesel, cng" value={form.fuels} onChange={(e) => setForm({ ...form, fuels: e.target.value })} />}
              <button className="primary" onClick={save}>Save place</button>
            </div>
          )}

          <p className="status">{status || `${shown.length} places within ${radius} km`}</p>
          <ul>
            {shown.map((p) => (
              <li key={p.id} style={{ borderLeftColor: COLORS[p.type] }}>
                <b>{p.name}</b>
                <div className="meta">
                  {LABEL[p.type]} · {p.distance?.toFixed(1)} km{p.brand && p.brand !== p.name ? ' · ' + p.brand : ''}
                  {p.type === 'fuel' && <><br />{p.fuels.join(', ')}{!p.fuelsKnown && ' (not confirmed on map)'}</>}
                  {p.sockets && <><br />Plugs: {p.sockets}</>}
                  {p.hours && <><br />Hours: {p.hours}</>}
                  {p.source === 'user' && <><br />{p.verified ? 'Verified by users' : `Unverified · ${p.votes}/3 confirmations`}</>}
                </div>
                <div className="acts">
                  {p.phone && <a href={`tel:${p.phone.split(';')[0].replace(/\s/g, '')}`}>Call {p.phone.split(';')[0]}</a>}
                  <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`}>Directions</a>
                  <button onClick={() => share(p)}>Share</button>
                  <button onClick={() => setFocus({ to: [p.lat, p.lon], zoom: 17 })}>Show on map</button>
                  {p.source === 'user' && !p.verified && <button onClick={() => confirm(p.id)}>It is here</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <MapContainer center={[23.0225, 72.5714]} zoom={12} className="map">
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" maxZoom={19} />
          <MapEvents onClick={onMapClick} />
          <MoveTo to={focus?.to ?? null} zoom={focus?.zoom ?? 13} />
          {pos && <Marker position={pos}><Popup>You are here</Popup></Marker>}
          {draft && <Marker position={draft}><Popup>New place</Popup></Marker>}
          {shown.map((p) => (
            <CircleMarker key={p.id} center={[p.lat, p.lon]} radius={7} pathOptions={{ color: '#fff', weight: 1.5, fillColor: COLORS[p.type], fillOpacity: 1 }}>
              <Popup>{p.name}</Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </main>
    </div>
  );
}
