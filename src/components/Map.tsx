"use client";

interface MapProps {
  center?: [number, number];
  pickupName?: string;
  zoomOffset?: number; // إمكانية التحكم في مساحة الرؤية
}

export default function Map({
  center = [17.7022, 33.9822], // إحداثيات عطبرة
  pickupName = "ود إلياس / عطبرة",
  zoomOffset = 0.008,
}: MapProps) {
  const [lat, lng] = center;

  // حساب الحدود بناءً على الإحداثيات
  const bbox = `${lng - zoomOffset}%2C${lat - zoomOffset}%2C${lng + zoomOffset}%2C${lat + zoomOffset}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="w-full h-full min-h-[250px] rounded-2xl overflow-hidden border border-neutral-800 relative bg-[#1A1D20] shadow-lg">
      <iframe
        title="خريطة الموقع"
        width="100%"
        height="100%"
        style={{
          filter: "invert(90%) hue-rotate(180deg) brightness(85%) contrast(110%)",
          border: 0,
        }}
        loading="lazy"
        src={mapUrl}
        className="w-full h-full min-h-[250px]"
      />
      
      {/* شريط الموقع */}
      <div className="absolute top-3 right-3 bg-[#121212]/90 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 z-10 backdrop-blur-sm flex items-center gap-1">
        <span>📍</span>
        <span>{pickupName}</span>
      </div>
    </div>
  );
}
