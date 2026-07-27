"use client";

import { useEffect, useState } from "react";

interface MapProps {
  center?: [number, number];
  pickupName?: string;
}

export default function Map({ center = [17.7022, 33.9822], pickupName }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-[#0a0c10] flex items-center justify-center text-xs text-slate-500 rounded-2xl">
        🗺️ جاري التجهيز...
      </div>
    );
  }

  // استخدام OpenStreetMap عبر iframe آمن ومباشر يضمن عدم تعليق المتصفح إطلاقاً
  const lat = center[0];
  const lng = center[1];
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800">
      <iframe
        title="Map"
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        className="w-full h-full opacity-80 filter contrast-125 brightness-90"
      ></iframe>
      
      {/* شريط معلومات الموقع فوق الخريطة */}
      <div className="absolute bottom-2 right-2 left-2 bg-[#12161f]/90 backdrop-blur-md border border-slate-800 p-2 rounded-xl flex items-center justify-between text-[11px] text-white shadow-lg pointer-events-none">
        <span className="flex items-center gap-1">
          📍 <strong className="text-amber-400">{pickupName || "الموقع المحدد"}</strong>
        </span>
        <span className="text-[9px] text-slate-400">عطبرة، السودان</span>
      </div>
    </div>
  );
}
