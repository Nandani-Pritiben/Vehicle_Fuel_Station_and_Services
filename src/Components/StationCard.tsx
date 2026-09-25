import type { StationWithDetails } from "../types";

interface Props {
  station: StationWithDetails;
  selected: boolean;
  onSelect: () => void;
}

const categoryLabel: Record<string, string> = {
  fuel_station: "Fuel Station",
  ev_charger: "EV Charger",
  puncture_shop: "Puncture Shop",
  garage: "Garage",
};

export function StationCard({ station, selected, onSelect }: Props) {
  const isEv = station.details.fuelTypes.includes("ev");

  return (
    <li>
      <button
        type="button"
        className={`station-card${selected ? " selected" : ""}`}
        onClick={onSelect}
        aria-pressed={selected}
      >
        <div className="station-card-top">
          <div>
            <p className="station-name">{station.name}</p>
            <p className="station-brand">{station.brand}</p>
          </div>
          <span className="distance-chip">{station.distanceKm.toFixed(1)} km</span>
        </div>

        <div className="station-meta-row">
          <span className={`badge${isEv ? " ev" : ""}`}>{categoryLabel[station.category]}</span>
          <span className={`badge ${station.isOpenNow ? "open" : "closed"}`}>
            {station.isOpenNow ? "Open now" : "Closed"}
          </span>
          {station.verified && <span className="badge verified">Verified</span>}
        </div>
      </button>
    </li>
  );
}
