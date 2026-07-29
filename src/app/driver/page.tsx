"use client";

import { useState, useEffect } from "react";
import Map from "@/components/Map";
import { supabase } from "@/lib/supabase";

export default function DriverPage() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "myTrip">("requests");
  const [requests, setRequests] = useState<any[]>([]);

  // دالة لتشغيل صوت التنبيه عند وصول طلب جديد
  const playNotificationSound = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch((e) => console.log("Audio play blocked:", e));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchRequests();

    // الاستماع للطلبات الجديدة في الوقت الفعلي مع تشغيل الجرس
    const channel = supabase
      .channel("driver-realtime-v2")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rides" },
        (payload) => {
          if (payload.new.status === "pending") {
            setRequests((prev) => [payload.new, ...prev]);
            playNotificationSound(); // 🔔 تشغيل جرس التنبيه
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
  };

  const acceptTrip = async (tripId: string) => {
    const { error } = await supabase
      .from("rides")
      .update({ status: "accepted" })
      .eq("id", tripId);

    if (!error) {
      alert("تم قبول المشوار بنجاح! 🤝");
      fetchRequests();
    } else {
      alert("حدث خطأ أثناء قبول المشوار: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-[#161b22] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        
        {/* الهيدر */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛺</span>
            <div>
              <h1 className="font-bold text-lg text-white">لوحة السائق</h1>
              <p className="text-[10px] text-slate-400">عطبرة، السودان</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsAvailable(!isAvailable)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              isAvailable
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
            }`}
          >
            {isAvailable ? "متاح للطلبات 🟢" : "غير متاح 🔴"}
          </button>
        </div>

        {/* الخريطة */}
        <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
          <Map pickupName="موقعك الحالي" />
        </div>

        {/* التبويبات */}
        <div className="grid grid-cols-2 gap-2 bg-[#0d1117] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("requests")}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "requests" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            الطلبات المتاحة 📥 ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab("myTrip")}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "myTrip" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            المشوار الحالي 🚕
          </button>
        </div>

        {/* قائمة الطلبات */}
        {activeTab === "requests" ? (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">لا توجد طلبات متاحة حالياً... بانتظار الزبائن 🛎️</div>
            ) : (
              requests.map((trip) => (
                <div key={trip.id} className="bg-[#0d1117] border border-amber-500/30 p-4 rounded-2xl space-y-2 shadow-lg">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      طلب {trip.service_type || "ركشة"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(trip.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="text-sm space-y-1.5">
                    <p className="text-slate-200">👤 <b>العميل:</b> {trip.passenger_name || "مسافر"}</p>
                    
                    {/* رقم الهاتف واضح تماماً مع زر اتصال */}
                    <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-xs">📞 الهاتف:</span>
                      <a 
                        href={`tel:${trip.phone_number}`} 
                        className="text-amber-400 font-mono font-bold text-xs hover:underline"
                      >
                        {trip.phone_number || "غير متوفر"}
                      </a>
                    </div>

                    <p className="text-slate-300">📍 <b>من:</b> {trip.pickup_location}</p>
                    <p className="text-slate-300">🏁 <b>إلى:</b> {trip.destination}</p>
                    <p className="text-amber-400 font-bold">🤝 <b>العرض:</b> {trip.offered_price ? `${trip.offered_price} ج.س` : "مقاولة / مفاصلة"}</p>
                    
                    <div className="p-2 bg-[#161b22] border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                      <span className="text-slate-400">🏛️ الحساب البنكي:</span>
                      <span className="text-emerald-400 font-mono font-bold">{trip.bank_account || "لم يضف حساباً"}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => acceptTrip(trip.id)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition mt-2 active:scale-95"
                  >
                    قبول المشوار 🤝
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-[#0d1117] border border-slate-800 p-6 rounded-2xl text-center space-y-2">
            <p className="text-slate-400 text-sm">لا يوجد مشوار نشط حالياً</p>
          </div>
        )}

      </div>
    </div>
  );
}
