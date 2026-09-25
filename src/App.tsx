import { useMemo, useState } from "react";
import { FilterBar } from "./components/FilterBar";
import { StationCard } from "./components/StationCard";
import { MapView } from "./components/MapView";
import { DetailPanel } from "./components/DetailPanel";
import { stations, fuelEvDetails, serviceRecords } from "./data/mockStations";
import { haversineDistanceKm } from "./utils/haversine";
import type { FilterState, StationWithDetails } from "./types";

// User's current location — Krishnanagar, Ahmedabad (from the project's home base).
const USER_LOCATION = { latitude: 23.0395, longitude: 72.5895 };

const initialFilters: FilterState = {
  query: "",
  category: "all",
  fuelType: "all",
  vehicleType: "all",
  radiusKm: 25,
};

function buildStationList(): StationWithDetails[] {
  return stations.map((station) => {
    const details = fuelEvDetails.find((d) => d.stationId === station.id)!;
    const service = serviceRecords.find((s) => s.stationId === station.id);
    const distanceKm = haversineDistanceKm(
      USER_LOCATION.latitude,
      USER_LOCATION.longitude,
      station.latitude,
      station.longitude
    );
    return { ...station, details, service, distanceKm };
  });
}

export default function App() {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allStations = useMemo(buildStationList, []);

  const filtered = useMemo(() => {
    return allStations
      .filter((s) => s.distanceKm <= filters.radiusKm)
      .filter((s) => filters.category === "all" || s.category === filters.category)
      .filter((s) => filters.fuelType === "all" || s.details.fuelTypes.includes(filters.fuelType))
      .filter(
        (s) => filters.vehicleType === "all" || s.details.vehicleTypes.includes(filters.vehicleType)
      )
      .filter((s) =>
        filters.query.trim() === ""
          ? true
          : `${s.name} ${s.brand}`.toLowerCase().includes(filters.query.trim().toLowerCase())
      )
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [allStations, filters]);

  const selectedStation = filtered.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            Road<span className="accent">Ready</span>
          </div>
          <p className="brand-tag">
            Find fuel stations, EV chargers, puncture shops and garages nearby — even offline.
          </p>
        </div>

        <FilterBar filters={filters} onChange={setFilters} />

        <p className="results-meta">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} within {filters.radiusKm} km
        </p>

        <ul className="results-list">
          {filtered.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              selected={station.id === selectedId}
              onSelect={() => setSelectedId(station.id)}
            />
          ))}
        </ul>
      </aside>

      <main className="main-pane">
        <MapView stations={filtered} selectedId={selectedId} onSelect={setSelectedId} />
        <DetailPanel station={selectedStation} />
      </main>
    </div>
  );
}
