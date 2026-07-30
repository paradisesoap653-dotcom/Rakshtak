"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Map from "@/components/Map";

interface Ride {
  id: string;
  passenger_name: string;
  phone_number: string;
  bank_account: string;
  pickup_location: string;
  destination: string;
  offered_price: number | null;
  service_type: string;
  status: string;
  created_at: string;
}

export default function DriverPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [activeTab, setActiveTab] = useState<"available" | "active">("available");
  const [loading, setLoading] = useState(true);

  // جلب الطلبات
  const fetchRides = async () => {
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
    fetchRides();

    // الاستماع المباشر للطلبات الجديدة والتحديثات
    const channel = supabase
      .channel("driver-rides")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rides" },
        () => {
          fetchRides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // دالة قبول الطلب
  const acceptRide = async (id: string) => {
    const { error } = await supabase
      .from("rides")
      .update({ status: "accepted" })
      .eq("id", id);

    if (error) {
      alert("حدث خطأ أثناء قبول الطلب: " + error.message);
    } else {
      setActiveTab("active");
    }
  };

  // دالة إنهاء المشوار
  const completeRide = async (id: string) => {
    const { error } = await supabase
      .from("rides")
      .update({ status: "completed" })
      .eq("id", id);

    if (error) {
      alert("حدث خطأ أثناء إنهاء المشوار: " + error.message);
    } else {
      alert("تم إنهاء المشوار بنجاح! 🚀");
      setActiveTab("available");
    }
  };

  const availableRides = rides.filter((r) => r.status === "pending");
  const activeRides = rides.filter((r) => r.status === "accepted");

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-3 pt-4 flex flex-col items-center justify-start">
      <div className="w-full max-w-md bg-[#161b22] border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-4">
        
        {/* الهيدر */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛺</span>
            <div>
              <h1 className="font-bold text-base text-white">لوحة السائق</h1>
              <p className="text-[10px] text-slate-400">عطبرة، السودان</p>
            </div>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-bold">
            🟢 متاح للطلبات
          </span>
        </div>

        {/* الخريطة */}
        <div className="w-full h-36 rounded-2xl overflow-hidden border border-slate-800">
          <Map pickupName="موقعك الحالي" />
        </div>

        {/* أزرار التبديل */}
        <div className="grid grid-cols-2 gap-2 bg-[#0d1117] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("available")}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "available"
                ? "bg-amber-500 text-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            الطلبات المتاحة 🛎️ ({availableRides.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "active"
                ? "bg-amber-500 text-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            المشوار الحالي 🚕 ({activeRides.length})
          </button>
        </div>

        {/* قائمة الطلبات */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-xs text-slate-500 py-6">جاري التحميل...</p>
          ) : activeTab === "available" ? (
            availableRides.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">
                🔔 لا توجد طلبات متاحة حالياً... بانتظار الزبائن
              </p>
            ) : (
              availableRides.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-[#0d1117] border border-slate-800 rounded-2xl p-3.5 space-y-2.5"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-400">👤 {ride.passenger_name}</span>
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md text-[10px]">
                      {ride.service_type || "ركشة"}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300">
                    <p>📍 <strong>من:</strong> {ride.pickup_location}</p>
                    <p>🏁 <strong>إلى:</strong> {ride.destination}</p>
                    {ride.offered_price && (
                      <p className="text-amber-400 font-bold">🤝 السعر: {ride.offered_price} ج.س</p>
                    )}
                  </div>

                  {/* تفاصيل الاتصال والحساب */}
                  <div className="bg-[#161b22] p-2.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">📞 الهاتف:</span>
                      <a
                        href={`tel:${ride.phone_number}`}
                        className="text-amber-400 font-mono font-bold hover:underline dir-ltr"
                      >
                        {ride.phone_number || "غير محدد"}
                      </a>
                    </div>
                    {ride.bank_account && (
                      <div className="flex justify-between items-center border-t border-slate-800/80 pt-1.5">
                        <span className="text-slate-400">🏛️ الحساب البنكي:</span>
                        <span className="text-slate-200 font-mono text-[11px]">{ride.bank_account}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => acceptRide(ride.id)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
                  >
                    قبول المشوار ✅
                  </button>
                </div>
              ))
            )
          ) : (
            activeRides.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">
                🚕 لا يوجد مشوار قيد التنفيذ حالياً
              </p>
            ) : (
              activeRides.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-[#0d1117] border border-amber-500/40 rounded-2xl p-3.5 space-y-3"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-400">👤 {ride.passenger_name} (مشوار جاري)</span>
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md text-[10px]">
                      مقبول
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300">
                    <p>📍 <strong>من:</strong> {ride.pickup_location}</p>
                    <p>🏁 <strong>إلى:</strong> {ride.destination}</p>
                  </div>

                  {/* زر الاتصال السريع بالعميل */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${ride.phone_number}`}
                      className="py-2 text-center bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      📞 اتصال بالزبون
                    </a>
                    <a
                      href={`https://wa.me/${ride.phone_number?.replace("+", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 text-center bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      💬 واتساب
                    </a>
                  </div>

                  {/* زر إنهاء المشوار */}
                  <button
                    onClick={() => completeRide(ride.id)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
                  >
                    إكمال/إنهاء المشوار 🏁
                  </button>
                </div>
              ))
            )
          )}
        </div>

      </div>
    </div>
  );
}
