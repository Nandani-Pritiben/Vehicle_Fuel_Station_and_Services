import { Injectable, NotFoundException, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';
import { Place, PlaceType } from './place.types';

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const VERIFY_AT = 3; // distinct other users who must confirm a user-added place
const TTL = 60 * 60 * 1000;

export const km = (a: number, b: number, c: number, d: number) => {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

// One query shape for all reads. $1 = lat, $2 = lon (distance is measured from this point)
const SELECT = `
  select p.*, count(v.client_id)::int as votes,
         ST_Distance(p.geog, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 as distance
  from user_places p
  left join place_votes v on v.place_id = p.id`;

@Injectable()
export class PlacesService implements OnModuleDestroy {
  private db: Pool;
  private cache = new Map<string, { t: number; data: Place[] }>();

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is missing. Copy backend/.env.example to backend/.env and paste your Supabase connection string.');
    }
    this.db = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 });
  }

  onModuleDestroy() { return this.db.end(); }

  private fromRow(r: any): Place {
    return {
      id: r.id, name: r.name, type: r.type as PlaceType, lat: r.lat, lon: r.lon,
      fuels: r.fuels, fuelsKnown: r.fuels_known, brand: r.brand, phone: r.phone, hours: r.hours,
      sockets: '', veh: r.veh, source: 'user', votes: r.votes, verified: r.votes >= VERIFY_AT,
      distance: r.distance == null ? undefined : +Number(r.distance).toFixed(2),
    };
  }

  private async userPlaces(lat: number, lon: number, radius: number): Promise<Place[]> {
    try {
      const { rows } = await this.db.query(
        `${SELECT}
         where ST_DWithin(p.geog, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
         group by p.id`,
        [lat, lon, radius * 1000],
      );
      return rows.map((r) => this.fromRow(r));
    } catch (e) {
      console.error('Supabase query failed, returning map data only:', (e as Error).message);
      return [];
    }
  }

  private async getOne(id: string, lat = 0, lon = 0): Promise<Place> {
    const { rows } = await this.db.query(`${SELECT} where p.id = $3 group by p.id`, [lat, lon, id]);
    if (!rows[0]) throw new NotFoundException('Place not found');
    const p = this.fromRow(rows[0]);
    delete p.distance;
    return p;
  }

  async search(lat: number, lon: number, radius: number): Promise<Place[]> {
    const [osm, mine] = await Promise.all([this.osm(lat, lon, radius), this.userPlaces(lat, lon, radius)]);
    return [...osm.map((p) => ({ ...p, distance: +km(lat, lon, p.lat, p.lon).toFixed(2) })), ...mine]
      .filter((p) => p.distance! <= radius)
      .sort((a, b) => a.distance! - b.distance!);
  }

  async add(b: any): Promise<Place> {
    const isFuel = b.type === 'fuel';
    const given: string[] = Array.isArray(b.fuels) ? b.fuels.map((f: any) => String(f).slice(0, 12)).slice(0, 6) : [];
    const id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    try {
      await this.db.query(
        `insert into user_places (id, name, type, lat, lon, geog, fuels, fuels_known, brand, phone, hours, veh, creator)
         values ($1,$2,$3,$4,$5, ST_SetSRID(ST_MakePoint($5,$4),4326)::geography, $6,$7,$8,$9,$10,$11,$12)`,
        [id, String(b.name).trim().slice(0, 80), b.type, b.lat, b.lon,
         isFuel ? (given.length ? given : ['petrol', 'diesel']) : [], isFuel && given.length > 0,
         String(b.brand ?? '').slice(0, 40), String(b.phone ?? '').slice(0, 20), String(b.hours ?? '').slice(0, 40),
         Array.isArray(b.veh) ? b.veh : [], b.clientId],
      );
    } catch (e) {
      console.error('Insert failed:', (e as Error).message);
      throw new ServiceUnavailableException('Could not save the place right now.');
    }
    return this.getOne(id);
  }

  async confirm(id: string, clientId: string): Promise<Place> {
    const { rows } = await this.db.query('select creator from user_places where id = $1', [id]);
    if (!rows[0]) throw new NotFoundException('Only user-added places can be confirmed');
    if (rows[0].creator !== clientId) {
      await this.db.query('insert into place_votes (place_id, client_id) values ($1,$2) on conflict do nothing', [id, clientId]);
    }
    return this.getOne(id);
  }

  // ---------- OpenStreetMap via Overpass ----------
  private async osm(lat: number, lon: number, radius: number): Promise<Place[]> {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)},${radius}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.t < TTL) return hit.data;

    const m = radius * 1000;
    const q = `[out:json][timeout:25];(
      nwr["amenity"="fuel"](around:${m},${lat},${lon});
      nwr["amenity"="charging_station"](around:${m},${lat},${lon});
      nwr["shop"~"^(car_repair|tyres|motorcycle_repair)$"](around:${m},${lat},${lon});
      nwr["craft"~"^(mechanic|tyre_repair)$"](around:${m},${lat},${lon});
    );out center tags;`;

    for (const url of OVERPASS) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'roadside-finder/1.0' },
          body: 'data=' + encodeURIComponent(q),
        });
        if (!res.ok) continue;
        const json: any = await res.json();
        const data = (json.elements as any[]).map((e) => this.convert(e)).filter((p): p is Place => !!p);
        this.cache.set(key, { t: Date.now(), data });
        return data;
      } catch { /* try next mirror */ }
    }
    if (hit) return hit.data; // stale cache beats nothing
    throw new ServiceUnavailableException('Map data service is busy. Try again in a minute.');
  }

  private convert(e: any): Place | null {
    const t = e.tags ?? {};
    const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
    if (lat == null || lon == null) return null;

    let type: PlaceType; const fuels: string[] = []; let fuelsKnown = false;
    if (t.amenity === 'fuel') {
      type = 'fuel';
      if (['fuel:petrol', 'fuel:octane_91', 'fuel:octane_95', 'fuel:octane_100'].some((k) => t[k] === 'yes')) fuels.push('petrol');
      if (t['fuel:diesel'] === 'yes') fuels.push('diesel');
      if (t['fuel:cng'] === 'yes' || t['fuel:lpg'] === 'yes') fuels.push('cng');
      fuelsKnown = fuels.length > 0;
      if (!fuelsKnown) fuels.push('petrol', 'diesel'); // assumption, flagged to the user
    } else if (t.amenity === 'charging_station') type = 'ev';
    else if (t.shop === 'tyres' || t.craft === 'tyre_repair') type = 'puncture';
    else if (t.shop === 'car_repair' || t.shop === 'motorcycle_repair' || t.craft === 'mechanic') type = 'garage';
    else return null;

    const veh: string[] = [];
    if (t.motorcar === 'yes' || t.shop === 'car_repair') veh.push('4');
    if (t.motorcycle === 'yes' || t.shop === 'motorcycle_repair') veh.push('2');
    if (t.hgv === 'yes') veh.push('h');

    const labels = { fuel: 'Fuel station', ev: 'EV charger', garage: 'Garage', puncture: 'Puncture / tyre shop' };
    return {
      id: `${e.type}${e.id}`, name: t.name || t.brand || t.operator || labels[type], type, lat, lon,
      fuels, fuelsKnown, brand: t.brand || t.operator || '',
      phone: t.phone || t['contact:phone'] || t.mobile || t['contact:mobile'] || '',
      hours: t.opening_hours || '',
      sockets: Object.keys(t).filter((k) => k.startsWith('socket:') && !k.includes(':output')).map((k) => k.slice(7)).join(', '),
      veh, source: 'osm', votes: 0, verified: true,
    };
  }
}
