export type PlaceType = 'fuel' | 'ev' | 'garage' | 'puncture';

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  lat: number;
  lon: number;
  fuels: string[];        // petrol | diesel | cng
  fuelsKnown: boolean;    // false when OpenStreetMap has no fuel tags
  brand: string;
  phone: string;
  hours: string;
  sockets: string;
  veh: string[];          // '2' | '4' | 'h'
  source: 'osm' | 'user';
  votes: number;
  verified: boolean;
  distance?: number;      // km, added per search
}
