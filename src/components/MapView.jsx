import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers
const defaultIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userLocationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapViewportUpdater({ results, searchedLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!results || results.length === 0) {
      return;
    }

    const refreshMapSize = () => {
      map.invalidateSize();
    };

    window.requestAnimationFrame(refreshMapSize);
    const timeoutId = setTimeout(refreshMapSize, 80);

    const points = results.map((item) => [item.lat, item.lng]);
    if (
      searchedLocation &&
      typeof searchedLocation.lat === "number" &&
      typeof searchedLocation.lng === "number"
    ) {
      points.push([searchedLocation.lat, searchedLocation.lng]);
    }

    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
    }

    return () => clearTimeout(timeoutId);
  }, [map, results, searchedLocation]);

  return null;
}

export default function MapView({ results, selectedId, onSelectResult, searchedLocation }) {
  if (!results || results.length === 0) {
    return (
      <div className="map-container empty">
        <p>No locations to display</p>
      </div>
    );
  }

  // Center on first result
  const center = [results[0].lat, results[0].lng];

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={13}
        className="leaflet-map"
        style={{ width: "100%", height: "100%" }}
      >
        <MapViewportUpdater results={results} searchedLocation={searchedLocation} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {searchedLocation &&
          typeof searchedLocation.lat === "number" &&
          typeof searchedLocation.lng === "number" && (
            <Marker
              position={[searchedLocation.lat, searchedLocation.lng]}
              icon={userLocationIcon}
            >
              <Popup>
                <div className="map-popup">
                  <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                    📍 Your searched location
                  </div>
                  <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                    {searchedLocation.name}
                  </div>
                  <div style={{ fontSize: "12px" }}>
                    {searchedLocation.address}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

        {results.map((result, idx) => (
          <Marker
            key={result.id}
            position={[result.lat, result.lng]}
            icon={defaultIcon}
            onClick={() => onSelectResult(result.id)}
          >
            <Popup>
              <div className="map-popup">
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  #{idx + 1} {result.name}
                </div>
                <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                  ⭐ {result.rating} ({result.reviewCount} reviews)
                </div>
                <div style={{ fontSize: "12px" }}>
                  {result.cuisine} • {result.price}
                </div>
                <a
                  href={result.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    marginTop: "8px",
                    color: "#f97316",
                    textDecoration: "none",
                    fontSize: "12px",
                  }}
                >
                  Open in Maps →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
