import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function DraggableMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          setPosition([lat, lng]);
        },
      }}
    />
  );
}

export default function ShopMap({ lat, lng, onPositionChange, onUseMyLocation }) {
  const position = [lat, lng];

  return (
    <div className="map-section">
      <div className="map-header">
        <h3>Pin Shop Location</h3>
        <button type="button" className="btn-blue map-locate" onClick={onUseMyLocation}>
          📍 Use My Location
        </button>
      </div>
      <MapContainer center={position} zoom={14} className="shop-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker position={position} setPosition={(p) => onPositionChange(p[0], p[1])} />
      </MapContainer>
      <p className="map-hint">Drag the marker to adjust precise location</p>
    </div>
  );
}
