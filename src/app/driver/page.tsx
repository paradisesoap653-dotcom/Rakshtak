"use client";

import { useState, useEffect } from "react";
import { 
  Power, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  Navigation,
  PhoneCall
} from "lucide-react";

export default function DriverDashboardPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [incomingRide, setIncomingRide] = useState<any>(null);
  const [acceptedRide, setAcceptedRide] = useState<any>(null); // الرحلة المقبولة حالياً

  // 1. جلب الطلبات المعلقة بشكل دوري كل 3 ثوانٍ (إذا كان أونلاين ولا توجد رحلة مقبولة)
  useEffect(() => {
    if (!isOnline || acceptedRide) return;

    const fetchPendingRides = async () => {
      try {
        const res = await fetch("/api/rides");
        if (res.ok) {
          const data = await res.json();
          if (data.rides && data.rides.length > 0) {
            setIncomingRide(data.rides[0]);
          } else {
            setIncomingRide(null);
          }
        }
      } catch (err) {
        console.error("خطأ في جلب الرحلات:", err);
      }
    };

    fetchPendingRides();
    const interval = setInterval(fetchPendingRides, 3000);

    return () => clearInterval(interval);
  }, [isOnline, acceptedRide]);

  // 2. دالة قبول الرحلة وتحديث الحالة في قاعدة البيانات
  const handleAcceptRide = async () => {
    if (!incomingRide) return;

    try {
      const res = await fetch("/api/rides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rideId: incomingRide.id,
          status: "accepted",
        }),
      });

      if (res.ok) {
        setAcceptedRide(incomingRide);
        setIncomingRide(null);
      } else {
        alert("حدث خطأ أثناء قبول الرحلة");
      }
    } catch (err) {
      console.error("خطأ في قبول الرحلة:", err);
    }
  };

  // 3. دالة إنهاء الرحلة
  const handleCompleteRide = async () => {
    if (!acceptedRide) return;

    try {
      await fetch("/api/rides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rideId: acceptedRide.id,
          status: "completed",
        }),
      });

      alert("تم إنهاء الرحلة واستلام المبلغ بنجاح!");
      setAcceptedRide(null);
    } catch (err) {
      console.error("خطأ في إنهاء الرحلة:", err);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#121212] text-white flex flex-col justify-between overflow-x-hidden font-sans dir-rtl" dir="rtl">
      
      {/* 1. Header: حالة الاتصال والكابتن */}
      <div className="fixed top-4 right-4 left-4 z-20 flex justify-between items-center bg-[#1E1E1E]/95 backdrop-blur-md p-3 rounded-2xl border border-gray-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg border border-amber-500/20">
            🛺
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">الكابتن عثمان</h2>
            <p className="text-[10px] text-gray-400">ركشة - خ 2 / 4589</p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsOnline(!isOnline);
            if (isOnline) {
              setIncomingRide(null);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition duration-300 shadow-lg ${
            isOnline 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" 
              : "bg-red-500/20 text-red-400 border border-red-500/40"
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isOnline ? "متصل (جاهز)" : "غير متصل"}</span>
        </button>
      </div>

      {/* 2. الإحصائيات السريعة */}
      <div className="fixed top-24 right-4 left-4 z-10 grid grid-cols-2 gap-3">
        <div className="bg-[#1E1E1E]/90 backdrop-blur-md border border-gray-800 p-3 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">أرباح اليوم</p>
            <p className="text-base font-extrabold text-amber-400">12,500 <span className="text-[10px]">ج.س</span></p>
          </div>
        </div>

        <div className="bg-[#1E1E1E]/90 backdrop-blur-md border border-gray-800 p-3 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">الرحلات المكتملة</p>
            <p className="text-base font-extrabold text-white">8 <span className="text-[10px]">رحلات</span></p>
          </div>
        </div>
      </div>

      {/* 3. الخلفية والأنيميشن */}
      <div className="fixed inset-0 z-0 bg-[#0c1017] flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-[#1E293B_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
        {!isOnline && (
          <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-gray-800 text-gray-400 text-sm font-medium z-10">
            قم بتفعيل الحالة لتبدأ استقبال الطلبات ⚡
          </div>
        )}
        {isOnline && !incomingRide && !acceptedRide && (
          <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-gray-800 text-amber-400 text-sm font-medium z-10 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
            في انتظار طلبات جديدة...
          </div>
        )}
      </div>

      {/* 4. شاشة تفاصيل الرحلة المقبولة الجارية */}
      {acceptedRide && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-[#1E1E1E] border-t-2 border-emerald-500 rounded-t-3xl p-5 pb-8 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <h3 className="text-sm font-bold text-emerald-400">الرحلة الحالية جارية 🚀</h3>
            </div>
            <span className="text-xs text-gray-400 font-bold">1,500 ج.س</span>
          </div>

          <div className="bg-[#121212] p-4 rounded-2xl border border-gray-800 space-y-3 text-xs">
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1 shrink-0"></div>
              <p className="text-gray-300"><span className="text-gray-500">من:</span> {acceptedRide.pickupLocation}</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-sm mt-1 shrink-0"></div>
              <p className="text-gray-300"><span className="text-gray-500">إلى:</span> {acceptedRide.destination}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => alert("جاري الاتصال بالراكب...")} 
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-gray-700"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              اتصال بالراكب
            </button>
          </div>

          <button
            onClick={handleCompleteRide}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-black rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20"
          >
            ✅ التوصيل واكتكمال الرحلة
          </button>
        </div>
      )}

      {/* 5. بطاقة طلب الرحلة الجديد (Popup Modal) */}
      {isOnline && incomingRide && !acceptedRide && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-[#1E1E1E] border-t-2 border-amber-500 rounded-t-3xl p-5 pb-8 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
          
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
              <h3 className="text-sm font-bold text-amber-400">طلب رحلة جديد وصل!</h3>
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> جديد
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-300 border border-gray-700">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">راكب جديد</h4>
                <p className="text-xs text-gray-400">نوع المركبة: {incomingRide.serviceType || "ركشة"}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-lg font-black text-amber-400">1,500 <span className="text-xs">ج.س</span></p>
              <p className="text-[10px] text-emerald-400">كاش عند الوصول</p>
            </div>
          </div>

          <div className="bg-[#121212] p-3 rounded-xl border border-gray-800/80 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1 shrink-0"></div>
              <p className="text-gray-300 truncate"><span className="text-gray-500">من:</span> {incomingRide.pickupLocation}</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-sm mt-1 shrink-0"></div>
              <p className="text-gray-300 truncate"><span className="text-gray-500">إلى:</span> {incomingRide.destination}</p>
            </div>
          </div>

          {/* أزرار التجاهل والقبول متواجدة في الأسفل بوضوح مرتفع */}
          <div className="grid grid-cols-2 gap-3 pt-2 pb-2">
            <button
              onClick={() => setIncomingRide(null)}
              className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-3.5 rounded-2xl font-bold text-sm transition active:scale-95"
            >
              <XCircle className="w-4 h-4" />
              تجاهل
            </button>

            <button
              onClick={handleAcceptRide}
              className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-black py-3.5 rounded-2xl font-bold text-sm transition shadow-lg active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              قبول الرحلة
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
