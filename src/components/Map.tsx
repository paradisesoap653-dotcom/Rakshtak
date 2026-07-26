"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// إصلاح أيقونات Leaflet الافتراضية
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// مكون لتحديث مركز الخريطة عند تغيير المكان
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

interface MapProps {
  center?: [number, number];
  pickupName?: string;
}

export default function Map({ center = [17.7022, 33.9822], pickupName = "ود إلياس / عطبرة" }: MapProps) {
  return (
    <div className="w-full h-full min-h-[250px] rounded-2xl overflow-hidden border border-neutral-800 relative z-0">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[250px]"
      >
        <ChangeView center={center} />
        
        {/* الخريطة بالثيم الداكن */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* علامة الموقع */}
        <Marker position={center} icon={customIcon}>
          <Popup>
            <span className="font-bold text-xs text-black dir-rtl">{pickupName}</span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
