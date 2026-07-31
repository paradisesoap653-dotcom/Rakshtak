"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Ride {
  id: string;
  passenger_name: string;
  phone_number: string;
  pickup_location: string;
  destination: string;
  offered_price: number | null;
  service_type: string;
  status: "pending" | "accepted" | "completed";
  driver_phone?: string;
  created_at?: string;
}

export default function AdminDashboard() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllRides = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRides(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllRides();

    const channel = supabase
      .channel("admin-rides-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rides" },
        () => {
          fetchAllRides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const deleteRide = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;
    const { error } = await supabase.from("rides").delete().eq("id", id);
    if (!error) {
      setRides((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert("خطأ أثناء الحذف: " + error.message);
    }
  };

  const totalRides = rides.length;
  const pendingRides = rides.filter((r) => r.status === "pending").length;
  const acceptedRides = rides.filter((r) => r.status === "accepted").length;
  const completedRides = rides.filter((r) => r.status === "completed").length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-3 pt-4 flex flex-col items-center justify-start">
      
      {/* شريط علوي */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛠️</span>
          <span className="font-bold text-base text-white">لوحة تحكم الأدمن</span>
        </div>

        <button
          type="button"
          onClick={() => { window.location.href = "/"; }}
          className="bg-amber-500/10 text-amber-400 font-bold text-xs px-3 py-1.5 rounded-xl border border-amber-500/30 transition cursor-pointer"
        >
          الرئيسية 🏠
        </button>
      </div>

      <div className="w-full max-w-md bg-[#161b22] border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-4">
        
        {/* مربعات الإحصائيات */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-[#0d1117] border border-slate-800 p-2.5 rounded-2xl">
            <div className="text-[10px] text-slate-400">إجمالي الطلبات</div>
            <div className="text-base font-bold text-white font-mono">{totalRides}</div>
          </div>
          <div className="bg-[#0d1117] border border-slate-800 p-2.5 rounded-2xl">
            <div className="text-[10px] text-amber-400">قيد الانتظار</div>
            <div className="text-base font-bold text-amber-400 font-mono">{pendingRides}</div>
          </div>
          <div className="bg-[#0d1117] border border-slate-800 p-2.5 rounded-2xl">
            <div className="text-[10px] text-emerald-400">جاري التنفيذ</div>
            <div className="text-base font-bold text-emerald-400 font-mono">{acceptedRides}</div>
          </div>
          <div className="bg-[#0d1117] border border-slate-800 p-2.5 rounded-2xl">
            <div className="text-[10px] text-blue-400">المكتملة</div>
            <div className="text-base font-bold text-blue-400 font-mono">{completedRides}</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-300">سجل الطلبات الحية:</h3>
          <button
            type="button"
            onClick={fetchAllRides}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition"
          >
            تحديث 🔄
          </button>
        </div>

        {/* قائمة الطلبات */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">جاري تحميل البيانات...</div>
          ) : rides.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">لا توجد طلبات مسجلة حتى الآن.</div>
          ) : (
            rides.map((ride) => (
              <div key={ride.id} className="bg-[#0d1117] border border-slate-800 rounded-2xl p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="font-bold text-white">👤 {ride.passenger_name}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    ride.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    ride.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {ride.status === 'pending' ? '⏳ منتظر' : ride.status === 'accepted' ? '🟢 جاري' : '🏁 مكتمل'}
                  </span>
                </div>

                <div className="space-y-1 text-slate-300">
                  <div>الخدمة: <span className="text-amber-400 font-bold">{ride.service_type}</span></div>
                  <div>📍 من: <span className="text-white">{ride.pickup_location}</span></div>
                  <div>🏁 إلى: <span className="text-white">{ride.destination}</span></div>
                  {ride.offered_price && (
                    <div className="text-amber-400 font-mono">💰 السعر: {ride.offered_price} ج.س</div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>📞 الراكب:</span>
                    <a href={`tel:${ride.phone_number}`} className="font-mono text-amber-400 font-bold" style={{ direction: 'ltr' }}>
                      {ride.phone_number}
                    </a>
                  </div>
                  {ride.driver_phone && (
                    <div className="flex justify-between text-slate-400">
                      <span>🚕 السائق:</span>
                      <span className="font-mono text-emerald-400 font-bold" style={{ direction: 'ltr' }}>
                        {ride.driver_phone}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => deleteRide(ride.id)}
                    className="text-[10px] text-red-400 hover:text-red-300 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 transition"
                  >
                    حذف الطلب 🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
