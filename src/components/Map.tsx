"use client";

import { useEffect, useState, useCallback } from "react";

interface MapProps {
  center?: [number, number];
  pickupName?: string;
  onLocationSelect?: (coords: [number, number]) => void;
}

export default function Map({ center = [17.7022, 33.9822], pickupName, onLocationSelect }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number]>(center);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // دالة جلب الموقع الحقيقي عبر الـ GPS
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("متصفحك لا يدعم تحديد الموقع الجغرافي");
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserCoords(newCoords);
        setIsLocating(false);

        if (onLocationSelect) {
          onLocationSelect(newCoords);
        }
      },
      (error) => {
        console.warn("GPS Error:", error.message);
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError("تم رفض إذن الوصول للموقع. يمكنك تفعيله من إعدادات المتصفح.");
        } else {
          setGpsError("تعذر الحصول على موقعك الدقيق حالياً.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onLocationSelect]);

  useEffect(() => {
    setIsMounted(true);
    // محاولة جلب الموقع التلقائي عند فتح الخريطة
    getCurrentLocation();
  }, [getCurrentLocation]);

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-[#0a0c10] flex items-center justify-center text-xs text-slate-500 rounded-2xl">
        🗺️ جاري التجهيز...
      </div>
    );
  }

  const lat = userCoords[0];
  const lng = userCoords[1];

  // رابط الخريطة الديناميكي المستند على إحداثيات الـ GPS الحقيقية
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.005}%2C${lng + 0.005}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-[#0a0c10]">
      {/* الخريطة الحقيقية */}
      <iframe
        title="Map"
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        className="w-full h-full opacity-85 filter contrast-125 brightness-90 transition-all duration-500"
      ></iframe>

      {/* زر تحديث/تحديد موقعي الآن عبر GPS */}
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={isLocating}
        className="absolute top-2 left-2 bg-[#12161f]/90 hover:bg-slate-800 text-white p-2 rounded-xl border border-slate-700/80 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-[10px] active:scale-95 transition-all z-10"
      >
        <span className={isLocating ? "animate-spin" : ""}>📍</span>
        <span>{isLocating ? "جاري التحديد..." : "موقعي الحالي"}</span>
      </button>

      {/* التنبيه في حالة وجود مشكلة بالصلاحيات */}
      {gpsError && (
        <div className="absolute top-2 right-2 left-12 bg-red-900/80 text-red-200 text-[10px] p-2 rounded-xl border border-red-700/50 backdrop-blur-md z-10">
          ⚠️ {gpsError}
        </div>
      )}

      {/* شريط معلومات الموقع الأسفل */}
      <div className="absolute bottom-2 right-2 left-2 bg-[#12161f]/90 backdrop-blur-md border border-slate-800 p-2 rounded-xl flex items-center justify-between text-[11px] text-white shadow-lg pointer-events-none z-10">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <strong className="text-amber-400">{pickupName || "موقعك عبر الـ GPS"}</strong>
        </span>
        <span className="text-[9px] text-slate-400 font-mono" dir="ltr">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>
    </div>
  );
}
