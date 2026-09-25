import type { StationWithDetails } from "../types";

interface Props {
  stations: StationWithDetails[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const categoryColor: Record<string, string> = {
  fuel_station: "#ff7a1a",
  ev_charger: "#0eb8a0",
  puncture_shop: "#c94a3b",
  garage: "#52565e",
};

export function MapView({ stations, selectedId, onSelect }: Props) {
  if (stations.length === 0) {
    return (
      <div className="map-surface">
        <span className="map-caption">No stations in this view</span>
      </div>
    );
  }

  const lats = stations.map((s) => s.latitude);
  const lons = stations.map((s) => s.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const pad = 40;
  const width = 800;
  const height = 400;

  const project = (lat: number, lon: number) => {
    const x =
      maxLon === minLon
        ? width / 2
        : pad + ((lon - minLon) / (maxLon - minLon)) * (width - pad * 2);
    // invert y since latitude increases upward
    const y =
      maxLat === minLat
        ? height / 2
        : height - pad - ((lat - minLat) / (maxLat - minLat)) * (height - pad * 2);
    return { x, y };
  };

  return (
    <div className="map-surface">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of nearby stations">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#cfc9b8" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {stations.map((s) => {
          const { x, y } = project(s.latitude, s.longitude);
          const isSelected = s.id === selectedId;
          const color = categoryColor[s.category] ?? "#52565e";
          return (
            <g
              key={s.id}
              transform={`translate(${x}, ${y})`}
              onClick={() => onSelect(s.id)}
              style={{ cursor: "pointer" }}
            >
              {isSelected && <circle r="16" fill={color} opacity="0.18" />}
              <circle r={isSelected ? 8 : 6} fill={color} stroke="#f6f4ef" strokeWidth="2" />
              {isSelected && (
                <text y="-16" textAnchor="middle" fontSize="13" fontFamily="Avenir Next, sans-serif" fontWeight={700} fill="#1b1d21">
                  {s.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <span className="map-caption">{stations.length} station{stations.length !== 1 ? "s" : ""} in view · offline cache</span>
    </div>
  );
}
