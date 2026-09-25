export type FuelType = "petrol" | "diesel" | "cng" | "ev";
export type StationCategory = "fuel_station" | "ev_charger" | "puncture_shop" | "garage";
export type VehicleType = "two_wheeler" | "three_wheeler" | "four_wheeler" | "commercial";

export interface Station {
  id: string;
  name: string;
  brand: string;
  category: StationCategory;
  latitude: number;
  longitude: number;
  address: string;
  isOpenNow: boolean;
  verified: boolean;
}

export interface FuelEvDetail {
  stationId: string;
  fuelTypes: FuelType[];
  vehicleTypes: VehicleType[];
  connectorTypes?: string[]; // only relevant for EV chargers
  chargingSpeedKw?: number; // only relevant for EV chargers
}

export interface ServiceRecord {
  stationId: string;
  services: string[]; // e.g. "Puncture Repair", "Battery Jumpstart", "Towing"
  averageWaitMinutes: number;
  rating: number; // 0-5, crowdsourced
}

export interface StationWithDetails extends Station {
  details: FuelEvDetail;
  service?: ServiceRecord;
  distanceKm: number;
}

export interface FilterState {
  query: string;
  category: StationCategory | "all";
  fuelType: FuelType | "all";
  vehicleType: VehicleType | "all";
  radiusKm: number;
}
