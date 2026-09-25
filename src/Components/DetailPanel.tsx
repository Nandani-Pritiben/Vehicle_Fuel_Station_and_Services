import type { StationWithDetails } from "../types";

interface Props {
  station: StationWithDetails | null;
}

const categoryLabel: Record<string, string> = {
  fuel_station: "Fuel Station",
  ev_charger: "EV Charger",
  puncture_shop: "Puncture Shop",
  garage: "Garage",
};

export function DetailPanel({ station }: Props) {
  if (!station) {
    return (
      <div className="empty-state">
        <h2>Select a station to see details</h2>
        <p>
          Choose a pin on the map or a card from the list to view fuel and EV details, services
          offered, and verified crowdsourced ratings.
        </p>
      </div>
    );
  }

  const { details, service } = station;

  return (
    <div className="detail-panel">
      <p className="detail-eyebrow">{categoryLabel[station.category]}</p>
      <h1 className="detail-title">{station.name}</h1>
      <p className="detail-address">
        {station.brand} · {station.address}
      </p>

      <div className="detail-stat-row">
        <div className="detail-stat">
          <div className="stat-value">{station.distanceKm.toFixed(1)} km</div>
          <div className="stat-label">Distance</div>
        </div>
        <div className="detail-stat">
          <div className="stat-value">{station.isOpenNow ? "Open" : "Closed"}</div>
          <div className="stat-label">Status now</div>
        </div>
        {service && (
          <div className="detail-stat">
            <div className="stat-value">{service.rating.toFixed(1)}★</div>
            <div className="stat-label">Community rating</div>
          </div>
        )}
      </div>

      {details.fuelTypes.length > 0 && (
        <div className="detail-section">
          <h3>Fuel types available</h3>
          <div className="chip-row">
            {details.fuelTypes.map((f) => (
              <span key={f} className="chip">
                {f.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {details.connectorTypes && details.connectorTypes.length > 0 && (
        <div className="detail-section">
          <h3>EV connectors</h3>
          <div className="chip-row">
            {details.connectorTypes.map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))}
            {details.chargingSpeedKw && <span className="chip">{details.chargingSpeedKw} kW</span>}
          </div>
        </div>
      )}

      <div className="detail-section">
        <h3>Supported vehicles</h3>
        <div className="chip-row">
          {details.vehicleTypes.map((v) => (
            <span key={v} className="chip">
              {v.replace("_", " ")}
            </span>
          ))}
        </div>
      </div>

      {service && service.services.length > 0 && (
        <div className="detail-section">
          <h3>Services offered</h3>
          <div className="chip-row">
            {service.services.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
          <div className="detail-body" style={{ marginTop: 10 }}>
            <p>Average wait time reported by users: {service.averageWaitMinutes} minutes.</p>
          </div>
        </div>
      )}

      <div className="detail-section">
        <h3>Data source</h3>
        <div className="detail-body">
          <p>
            {station.verified
              ? "This listing has passed multi-user verification and geofencing checks."
              : "This listing is crowdsourced and pending multi-user verification."}
          </p>
        </div>
      </div>
    </div>
  );
}
