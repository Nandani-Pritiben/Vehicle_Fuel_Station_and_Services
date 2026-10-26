export type PlaceType = 'fuel' | 'ev' | 'garage' | 'puncture';

export interface Place {
  id: string; name: string; type: PlaceType; lat: number; lon: number;
  fuels: string[]; fuelsKnown: boolean; brand: string; phone: string; hours: string;
  sockets: string; veh: string[]; source: 'osm' | 'user'; votes: number; verified: boolean;
  distance?: number;
}

export type NewPlace = Pick<Place, 'name' | 'type' | 'lat' | 'lon' | 'phone' | 'hours'> & { fuels: string[] };
