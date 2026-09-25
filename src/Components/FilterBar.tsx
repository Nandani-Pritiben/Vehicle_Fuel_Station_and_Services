import type { FilterState, StationCategory } from "../types";

interface Props {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}

const categories: { value: StationCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "fuel_station", label: "Fuel" },
  { value: "ev_charger", label: "EV Charging" },
  { value: "puncture_shop", label: "Puncture" },
  { value: "garage", label: "Garage" },
];

export function FilterBar({ filters, onChange }: Props) {
  return (
    <div className="filters">
      <div className="search-field">
        <input
          type="text"
          placeholder="Search by station or brand name"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
        />
      </div>

      <div className="category-pills" role="group" aria-label="Filter by category">
        {categories.map((c) => (
          <button
            key={c.value}
            type="button"
            className="pill"
            aria-pressed={filters.category === c.value}
            onClick={() => onChange({ ...filters, category: c.value })}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="filter-row">
        <select
          value={filters.fuelType}
          onChange={(e) => onChange({ ...filters, fuelType: e.target.value as FilterState["fuelType"] })}
          aria-label="Fuel type"
        >
          <option value="all">Any fuel type</option>
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
          <option value="cng">CNG</option>
          <option value="ev">EV</option>
        </select>

        <select
          value={filters.vehicleType}
          onChange={(e) => onChange({ ...filters, vehicleType: e.target.value as FilterState["vehicleType"] })}
          aria-label="Vehicle type"
        >
          <option value="all">Any vehicle</option>
          <option value="two_wheeler">Two-wheeler</option>
          <option value="three_wheeler">Three-wheeler</option>
          <option value="four_wheeler">Four-wheeler</option>
          <option value="commercial">Commercial</option>
        </select>
      </div>

      <div className="filter-row">
        <select
          value={filters.radiusKm}
          onChange={(e) => onChange({ ...filters, radiusKm: Number(e.target.value) })}
          aria-label="Search radius"
        >
          <option value={2}>Within 2 km</option>
          <option value={5}>Within 5 km</option>
          <option value={10}>Within 10 km</option>
          <option value={25}>Within 25 km</option>
        </select>
      </div>
    </div>
  );
}
