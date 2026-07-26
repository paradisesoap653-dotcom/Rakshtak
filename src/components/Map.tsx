"use client";

interface MapProps {
  center?: [number, number];
  pickupName?: string;
}

export default function Map({
  center = [17.7022, 33.9822],
  pickupName = "ود إلياس / عطبرة",
}: MapProps) {
  const [lat, lng] = center;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="w-full h-full min-h-[250px] rounded-2xl overflow-hidden border border-neutral-800 relative bg-[#1A1D20]">
      <iframe
        title="عطبرة - الخريطة"
        width="100%"
        height="100%"
        style={{ filter: "invert(90%) hue-rotate(180deg) brightness(85%) contrast(110%)", border: 0 }}
        loading="lazy"
        src={mapUrl}
        className="w-full h-full min-h-[250px]"
      />
      <div className="absolute top-3 right-3 bg-[#121212]/90 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 z-10 backdrop-blur-sm">
        📍 {pickupName}
      </div>
    </div>
  );
}
