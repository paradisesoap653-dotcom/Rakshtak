"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

// 📍 تحميل الخريطة ديناميكياً مع إيقاف الـ SSR لتجنب مشاكل Prerender/Build
const DynamicMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-900/50 animate-pulse flex items-center justify-center text-xs text-slate-500 rounded-2xl border border-slate-800">
      جاري تحميل خريطة المشوار...
    </div>
  ),
});

export default function DriverPage() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingRides, setPendingRides] = useState<any[]>([]);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // جلب الرحلات المتاحة بانتظام
  const fetchRides = useCallback(async () => {
    if (!isOnline) return;
    try {
      const res = await fetch("/api/rides");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.rides)) {
          // فلترة الرحلات المعلقة والجديدة
          setPendingRides(data.rides.filter((r: any) => r.status === "pending"));
          
          // التحقق من وجود رحلة مقبولة قيد التنفيذ حالياً
          const current = data.rides.find((r: any) => r.status === "accepted");
          if (current) {
            setActiveRide(current);
          }
        }
      }
    } catch (error) {
      console.error("خطأ في جلب رحلات السائق:", error);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchRides();
    const interval = setInterval(() => {
      fetchRides();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchRides]);

  // قبول طلب الرحلة
  const handleAcceptRide = async (rideId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/rides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId, status: "accepted" }),
      });
      if (res.ok) {
        alert("تم قبول الرحلة! توجه لنقطة الانطلاق الآن.");
        fetchRides();
      } else {
        alert("عذراً، قد يكون تم قبول هذه الرحلة من سائق آخر.");
      }
    } catch (error) {
      console.error("خطأ في قبول الرحلة:", error);
    } finally {
      setLoading(false);
    }
  };

  // إنهاء الرحلة
  const handleCompleteRide = async (rideId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/rides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId, status: "completed" }),
      });
      if (res.ok) {
        alert("تم إنهاء الرحلة بنجاح. تحصيل المبلغ من الراكب.");
        setActiveRide(null);
        fetchRides();
      }
    } catch (error) {
      console.error("خطأ في إكمال الرحلة:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0c10] text-white flex flex-col items-center justify-start p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md space-y-4">
        
        {/* شريط حالة السائق (متصل / غير متصل) */}
        <div className="bg-[#12161f] border border-slate-800 p-4 rounded-3xl flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            <div>
              <h1 className="text-sm font-black text-white">لوحة الكابتن 🛺</h1>
              <p className="text-[11px] text-slate-400">
                {isOnline ? "أنت متصل الآن لاستقبال الطلبات" : "أنت غير متصل"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow ${
              isOnline
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            {isOnline ? "إيقاف الاستقبال" : "تفعيل الاستقبال"}
          </button>
        </div>

        {/* الرحلة الجارية حالياً إن وجدت */}
        {activeRide && (
          <div className="bg-[#12161f] border border-amber-500/40 p-5 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500 animate-pulse" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                رحلة جارية الآن 🚀
              </span>
              <span className="text-xs font-extrabold text-emerald-400">{activeRide.offeredPrice} ج.س</span>
            </div>

            <div className="h-44 rounded-2xl overflow-hidden border border-slate-800">
              <DynamicMap center={[17.7022, 33.9822]} pickupName={activeRide.pickupLocation} />
            </div>

            <div className="bg-[#0a0c10] p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">موقع الراكب:</span>
                <span className="font-bold text-white">{activeRide.pickupLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">الوجهة:</span>
                <span className="font-bold text-white">{activeRide.destination}</span>
              </div>
            </div>

            <button
              onClick={() => handleCompleteRide(activeRide.id)}
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl shadow-lg active:scale-95 transition-all text-xs disabled:opacity-50"
            >
              {loading ? "جاري التحديث..." : "✅ تم الوصول وإكمال الرحلة"}
            </button>
          </div>
        )}

        {/* قائمة الطلبات الجديدة المتاحة */}
        {!activeRide && (
          <div className="bg-[#12161f] border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-black text-white">الطلبات المتاحة القريبة</h2>
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-bold">
                {pendingRides.length} طلبات
              </span>
            </div>

            {!isOnline ? (
              <div className="bg-[#0a0c10] border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                <p className="text-2xl">💤</p>
                <p className="text-xs text-slate-400">قم بتفعيل الاستقبال لعرض الطلبات القريبة</p>
              </div>
            ) : pendingRides.length === 0 ? (
              <div className="bg-[#0a0c10] border border-slate-800/80 rounded-2xl p-8 text-center space-y-2">
                <p className="text-2xl">⏳</p>
                <p className="text-xs text-slate-400">في انتظار طلبات رحلات جديدة...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRides.map((ride) => (
                  <div key={ride.id} className="bg-[#0a0c10] border border-slate-800 p-4 rounded-2xl space-y-3 hover:border-slate-700 transition-all">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-white">
                        <span className="text-slate-400">من:</span>
                        <span className="font-bold text-amber-400">{ride.pickupLocation}</span>
                      </div>
                      <div className="flex justify-between items-center text-white">
                        <span className="text-slate-400">إلى:</span>
                        <span className="font-bold">{ride.destination}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-400 font-extrabold pt-1 border-t border-slate-800/50">
                        <span>المبلغ المستحق:</span>
                        <span className="text-sm">{ride.offeredPrice} ج.س</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptRide(ride.id)}
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold rounded-xl text-xs active:scale-95 transition-all shadow-md disabled:opacity-50"
                    >
                      {loading ? "جاري القبول..." : "قبول الطلب والتحرك 🛺"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
