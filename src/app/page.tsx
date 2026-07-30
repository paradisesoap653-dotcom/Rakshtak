"use client";

import { useState, useEffect } from "react";
import Map from "@/components/Map";
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
}

export default function Home() {
  const [passengerName, setPassengerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [serviceType, setServiceType] = useState("ركشة ركاب");

  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedRideId = localStorage.getItem("active_ride_id");
    if (savedRideId) {
      fetchRideStatus(savedRideId);
    }
  }, []);

  const fetchRideStatus = async (rideId: string) => {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (!error && data) {
      setActiveRide(data);
    }
  };

  useEffect(() => {
    if (!activeRide) return;

    const channel = supabase
      .channel("passenger-ride-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `id=eq.${activeRide.id}`,
        },
        (payload) => {
          setActiveRide(payload.new as Ride);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRide]);

  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();

    let val = phoneNumber.replace(/\D/g, "");
    if (val.startsWith("0")) val = val.slice(1);

    if (val.length < 9) {
      alert("الرجاء إدخال رقم هاتف سوداني صحيح (9 أرقام)");
      return;
    }

    const fullPhone = `+249${val}`;
    setLoading(true);

    const { data, error } = await supabase
      .from("rides")
      .insert([
        {
          passenger_name: passengerName,
          phone_number: fullPhone,
          pickup_location: pickupLocation,
          destination: destination,
          offered_price: offeredPrice ? parseFloat(offeredPrice) : null,
          service_type: serviceType,
          status: "pending",
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert("حدث خطأ أثناء طلب المشوار: " + error.message);
    } else if (data) {
      setActiveRide(data);
      localStorage.setItem("active_ride_id", data.id);
    }
  };

  const cancelRide = async () => {
    if (!activeRide) return;
    await supabase.from("rides").delete().eq("id", activeRide.id);
    localStorage.removeItem("active_ride_id");
    setActiveRide(null);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-3 pt-4 flex flex-col items-center justify-start relative">
      
      {/* شريط علوي مع زر التنقل المباشر */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 px-1 relative z-[999]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛺</span>
          <span className="font-bold text-base text-white">رَكْشَتَكْ</span>
        </div>

        <button
          type="button"
          onClick={() => { window.location.href = "/driver"; }}
          className="bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-400 font-bold text-xs px-3.5 py-2 rounded-xl border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer z-[999] shadow-lg"
        >
          <span>🚖</span> لوحة السائق
        </button>
      </div>

      <div className="w-full max-w-md bg-[#161b22] border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-4">
        
        <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
          <Map pickupName={pickupLocation || "موقعي"} destinationName={destination || "الوجهة"} />
        </div>

        {!activeRide ? (
          <form onSubmit={handleRequestRide} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">الاسم:</label>
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="اسمك الكريم"
                  className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">نوع الخدمة:</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none"
                >
                  <option value="ركشة ركاب">🛺 ركشة ركاب</option>
                  <option value="توك توك بضائع">🛺 توك توك بضائع</option>
                  <option value="تكسي">🚕 تكسي</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">📞 رقم الهاتف:</label>
              
              <div 
                className="flex items-stretch border border-slate-800 rounded-xl overflow-hidden bg-[#0d1117] focus-within:border-amber-500"
                style={{ direction: 'ltr' }}
              >
                <div className="bg-slate-800 text-amber-400 px-3 py-2 text-xs font-mono font-bold border-r border-slate-700 flex items-center gap-1.5 select-none shrink-0">
                  <span>🇸🇩</span>
                  <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>+249</span>
                </div>

                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="913009060"
                  className="w-full bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono text-left"
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">📍 مكان التحرك:</label>
                <input
                  type="text"
                  required
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="مثال: السوق الكبير"
                  className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">🏁 الوجهة:</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="مثال: حي المطار"
                  className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">💰 السعر المقترح (ج.س):</label>
              <input
                type="number"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(e.target.value)}
                placeholder="أدخل المبلغ المقترح"
                className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
            >
              {loading ? "جاري الإرسال..." : "طلب المشوار الان 🚀"}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center py-3">
            {activeRide.status === "pending" && (
              <div className="space-y-2">
                <div className="inline-block p-3 bg-amber-500/10 rounded-full text-amber-400 animate-pulse text-2xl">
                  ⏳
                </div>
                <h3 className="text-sm font-bold text-white">جاري البحث عن سائق قريب...</h3>
                <p className="text-xs text-slate-400">طلبك معروض الآن للسائقين، يرجى الانتظار</p>
              </div>
            )}

            {activeRide.status === "accepted" && (
              <div className="space-y-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                <div className="text-2xl">🎉</div>
                <h3 className="text-sm font-bold text-emerald-400">تم قبول مشوارك!</h3>
                <p className="text-xs text-slate-300">السائق في طريقه إليك الآن</p>
                {activeRide.driver_phone && (
                  <div className="pt-2">
                    <a
                      href={`tel:${activeRide.driver_phone}`}
                      className="inline-block py-2 px-4 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow"
                    >
                      الاتصال بالسائق 📞
                    </a>
                  </div>
                )}
              </div>
            )}

            {activeRide.status === "completed" && (
              <div className="space-y-2">
                <div className="text-2xl">🏁</div>
                <h3 className="text-sm font-bold text-white">اكتمل المشوار!</h3>
                <p className="text-xs text-slate-400">شكراً لاستخدامك تطبيق رَكْشَتَكْ</p>
              </div>
            )}

            <button
              onClick={cancelRide}
              className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold border border-red-500/20 rounded-xl text-xs transition"
            >
              {activeRide.status === "completed" ? "طلب مشوار جديد" : "إلغاء الطلب ❌"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
