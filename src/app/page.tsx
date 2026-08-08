"use client";

import { useState, useEffect } from "react";
import Map from "@/components/Map";
import { supabase } from "@/lib/supabase";

export default function PassengerHome() {
  const [passengerName, setPassengerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [serviceType, setServiceType] = useState("ركشة ركاب");
  const [loading, setLoading] = useState(false);
  const [activeRide, setActiveRide] = useState<any>(null);

  // 1. استرجاع البيانات والتحقق من المشوار النشط برقم ID المشوار
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("passenger_name");
      const savedPhone = localStorage.getItem("passenger_phone");
      const savedRideId = localStorage.getItem("active_ride_id");

      if (savedName) setPassengerName(savedName);
      if (savedPhone) setPhoneNumber(savedPhone);

      if (savedRideId) {
        fetchRideById(savedRideId);
      } else if (savedPhone) {
        checkExistingRideByPhone(savedPhone);
      }
    }
  }, []);

  // جلب المشوار مباشرة برقم الـ ID المخزن
  const fetchRideById = async (rideId: string) => {
    const { data } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .maybeSingle();

    if (data) {
      setActiveRide(data);
    } else {
      localStorage.removeItem("active_ride_id");
    }
  };

  // جلب آخر مشوار برقم الهاتف في حال عدم وجود ID مخزن
  const checkExistingRideByPhone = async (phone: string) => {
    const { data } = await supabase
      .from("rides")
      .select("*")
      .eq("phone_number", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && data.status !== "completed") {
      setActiveRide(data);
      localStorage.setItem("active_ride_id", data.id);
    }
  };

  // 2. الاستماع الفوري المباشر لتغييرات المشوار (قبول / إنهاء)
  useEffect(() => {
    if (!activeRide?.id) return;

    const channel = supabase
      .channel(`passenger-ride-${activeRide.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `id=eq.${activeRide.id}`,
        },
        (payload) => {
          const updatedRide = payload.new;
          setActiveRide(updatedRide);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRide?.id]);

  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();
    let val = phoneNumber.replace(/\D/g, "");
    if (val.startsWith("0")) val = val.slice(1);

    if (val.length < 9) {
      alert("الرجاء إدخال رقم هاتف سوداني صحيح (9 أرقام)");
      return;
    }

    const fullPhone = `+249${val}`;
    setLoading(true);

    if (typeof window !== "undefined") {
      localStorage.setItem("passenger_name", passengerName);
      localStorage.setItem("passenger_phone", fullPhone);
    }

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
      alert("حدث خطأ أثناء إرسال الطلب: " + error.message);
    } else if (data) {
      setActiveRide(data);
      localStorage.setItem("active_ride_id", data.id);
    }
  };

  // إغلاق الشاشة الاحتفالية وبدء طلب جديد فقط عند الضغط المباشر على الزر
  const handleStartNewRide = () => {
    localStorage.removeItem("active_ride_id");
    setActiveRide(null);
  };

  return (
    <div className="min-h-screen bg-[#161b22] text-slate-100 p-4 flex flex-col justify-between w-full min-w-full">
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-between space-y-5">
        
        {/* الشريط العلوي */}
        <header className="flex justify-between items-center pt-2 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛺</span>
            <span className="font-extrabold text-xl text-white tracking-wide">رَكْشَتُك</span>
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = "/driver"; }}
            className="bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-400 font-bold text-sm px-4 py-2.5 rounded-xl border border-amber-500/30 transition flex items-center gap-2 shadow-lg"
          >
            <span>🚖</span> لوحة السائق
          </button>
        </header>

        {/* الخريطة */}
        <div className="w-full h-52 rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl shrink-0">
          <Map pickupName={pickupLocation || "موقعي الحالي"} />
        </div>

        {/* كارت النموذج أو حالة الطلب */}
        {!activeRide ? (
          <form onSubmit={handleCreateRide} className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block text-right">الاسم:</label>
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="اسمك الكريم"
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block text-right">نوع الخدمة:</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-xl px-3 py-3 text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="ركشة ركاب">🛺 ركشة ركاب</option>
                  <option value="ركشة بضائع">📦 ركشة بضائع</option>
                  <option value="موتر توصيل">🏍️ موتر توصيل</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block text-right">📞 رقم الهاتف:</label>
              <div 
                className="flex items-stretch border border-slate-700 rounded-xl overflow-hidden bg-[#0d1117] focus-within:border-amber-500"
                style={{ direction: 'ltr' }}
              >
                <div className="bg-slate-800 text-amber-400 px-3.5 py-3 text-sm font-mono font-bold border-r border-slate-700 flex items-center gap-1.5 select-none shrink-0">
                  <span>🇸🇩</span>
                  <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>+249</span>
                </div>

                <input
                  type="tel"
                  required
                  value={phoneNumber.replace("+249", "")}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="9XXXXXXXX"
                  className="w-full bg-transparent px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none font-mono text-left"
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block text-right">📍 مكان التحرك:</label>
                <input
                  type="text"
                  required
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="مثال: السوق الكبير"
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block text-right">🏁 الوجهة:</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="مثال: حي المطار"
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block text-right">💰 السعر المقترح (ج.س):</label>
              <input
                type="number"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(e.target.value)}
                placeholder="أدخل المبلغ المقترح"
                className="w-full bg-[#0d1117] border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none font-mono text-right focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-extrabold rounded-2xl text-base shadow-xl transition mt-2 disabled:opacity-50"
            >
              {loading ? "جاري الإرسال..." : "طلب المشوار الآن 🚀"}
            </button>
          </form>
        ) : (
          <div className="bg-[#0d1117] border border-slate-700 rounded-2xl p-5 space-y-4 my-auto shadow-2xl">
            {activeRide.status === "pending" ? (
              <div className="text-center space-y-2">
                <span className="text-3xl animate-bounce inline-block">⏳</span>
                <h3 className="text-base font-bold text-amber-400">جاري البحث عن سائق...</h3>
                <p className="text-xs text-slate-400">تم نشر مشوارك للسائقين القريبين منك، يرجى الانتظار</p>
              </div>
            ) : activeRide.status === "accepted" ? (
              <div className="text-center space-y-2">
                <span className="text-3xl inline-block">🎉</span>
                <h3 className="text-base font-bold text-emerald-400">تم قبول طلبك! السائق في الطريق إليك</h3>
                {activeRide.driver_phone && (
                  <div className="pt-2">
                    <p className="text-xs text-slate-400 mb-1">رقم هاتف السائق:</p>
                    <a
                      href={`tel:${activeRide.driver_phone}`}
                      className="inline-block py-2.5 px-5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-mono font-bold text-sm rounded-xl border border-emerald-500/30 transition"
                      style={{ direction: "ltr" }}
                    >
                      📞 {activeRide.driver_phone}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              /* الشاشة الاحتفالية الثابتة عند إكمال المشوار */
              <div className="text-center space-y-3 py-2">
                <div className="text-5xl animate-bounce">🏁 🏁</div>
                <h3 className="text-xl font-extrabold text-amber-400">الحمد لله على السلامة! 🎉</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تم إكمال المشوار ووصولك إلى وجهتك بنجاح ✨
                </p>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs text-slate-400">
                  شكراً لاستخدامك تطبيق <strong className="text-amber-400">رَكْشَتُك</strong> 🛺
                </div>
              </div>
            )}

            <div className="text-xs space-y-2 border-t border-b border-slate-800 py-3 text-slate-300">
              <div>📍 <strong>من:</strong> {activeRide.pickup_location}</div>
              <div>🏁 <strong>إلى:</strong> {activeRide.destination}</div>
              {activeRide.offered_price && <div>💰 <strong>السعر:</strong> {activeRide.offered_price} ج.س</div>}
            </div>

            <button
              onClick={handleStartNewRide}
              className={`w-full py-3.5 font-extrabold text-xs rounded-xl transition shadow-lg ${
                activeRide.status === "completed"
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                  : "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
              }`}
            >
              {activeRide.status === "completed" ? "طلب مشوار جديد 🚀" : "إلغاء الطلب"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
