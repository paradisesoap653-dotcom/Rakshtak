"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Map from "@/components/Map";
import { supabase } from "@/lib/supabase";

interface ActiveTrip {
  id: string;
  pickup: string;
  destination: string;
  price: string;
  vehicleType: string;
  status: "pending" | "accepted" | "completed";
}

export default function HomePage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [price, setPrice] = useState("");
  const [vehicleType, setVehicleType] = useState<"ركشة" | "توك توك" | "تاكسي">("ركشة");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);

  // استرجاع رقم الهاتف المخزن تلقائياً عند تحميل الصفحة
  useEffect(() => {
    const savedPhone = localStorage.getItem("passenger_phone");
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      setIsLoggedIn(true);
    }
  }, []);

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    let val = phoneNumber.replace(/\D/g, "");
    if (val.startsWith("0")) val = val.slice(1);
    
    if (val.length < 9) {
      alert("الرجاء إدخال رقم هاتف سوداني صحيح (9 أرقام)");
      return;
    }

    const fullPhone = `+249${val}`;
    localStorage.setItem("passenger_phone", fullPhone);
    setPhoneNumber(fullPhone);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("passenger_phone");
    setIsLoggedIn(false);
    setPhoneNumber("");
    setActiveTrip(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("rides")
        .insert([
          {
            passenger_name: `مسافر_${phoneNumber.slice(-4)}`,
            phone_number: phoneNumber,
            pickup_location: pickup,
            destination: destination,
            offered_price: price ? parseFloat(price) : null,
            service_type: vehicleType,
            status: "pending",
          },
        ])
        .select();

      if (error) {
        alert("خطأ أثناء إرسال الطلب: " + error.message);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const trip = data[0];
        setActiveTrip({
          id: trip.id,
          pickup: trip.pickup_location,
          destination: trip.destination,
          price: trip.offered_price ? `${trip.offered_price} ج.س` : "حسب الاتفاق",
          vehicleType: trip.service_type || vehicleType,
          status: "pending",
        });

        // الاستماع الفوري لتحديثات السائق على هذا الطلب
        supabase
          .channel(`trip-${trip.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "rides",
              filter: `id=eq.${trip.id}`,
            },
            (payload) => {
              const newStatus = payload.new.status;
              if (newStatus === "accepted") {
                setActiveTrip((prev) => prev ? { ...prev, status: "accepted" } : null);
              } else if (newStatus === "completed") {
                setActiveTrip((prev) => prev ? { ...prev, status: "completed" } : null);
                setTimeout(() => {
                  setActiveTrip(null);
                  setIsLoading(false);
                  setPickup("");
                  setDestination("");
                  setPrice("");
                }, 4000);
              }
            }
          )
          .subscribe();
      }
    } catch (err: any) {
      alert("حدث خطأ غير متوقع: " + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-3 pt-4 flex flex-col items-center justify-start">
      
      {/* شريط علوي */}
      <div className="w-full max-w-md flex justify-between items-center mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛺</span>
          <span className="font-bold text-base text-white">ركشتك</span>
        </div>
        <Link
          href="/driver"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-full shadow-lg transition flex items-center gap-1.5"
        >
          <span>🚖</span> لوحة السائق
        </Link>
      </div>

      <div className="w-full max-w-md bg-[#161b22] border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-4">
        
        {!isLoggedIn ? (
          /* شاشة تسجيل الدخول برقم الهاتف أولاً */
          <form onSubmit={handlePhoneLogin} className="space-y-4 py-6">
            <div className="text-center space-y-1">
              <h2 className="text-base font-bold text-white">مرحباً بك في ركشتك 🛺</h2>
              <p className="text-xs text-slate-400">الرجاء إدخال رقم هاتفك للمتابعة</p>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">📞 رقم الهاتف:</label>
              <div className="flex dir-ltr border border-slate-800 rounded-xl overflow-hidden bg-[#0d1117] focus-within:border-amber-500">
                <span className="bg-slate-800 text-amber-400 px-3 py-2 text-xs font-mono flex items-center border-r border-slate-700 font-bold">
                  🇸🇩 +249
                </span>
                <input
                  type="tel"
                  required
                  value={phoneNumber.replace("+249", "")}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="913009060"
                  className="w-full bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
            >
              دخول 🚀
            </button>
          </form>
        ) : (
          /* واجهة طلب الرحلة المختصرة */
          <>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[10px] text-slate-400 font-mono">هاتف: {phoneNumber}</span>
              <button
                onClick={handleLogout}
                className="text-[10px] text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20 transition"
              >
                تغيير الرقم
              </button>
            </div>

            <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
              <Map pickupName={pickup || "موقعك الحالي"} />
            </div>

            {activeTrip ? (
              <div className="space-y-3">
                {activeTrip.status === "pending" && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-2">
                    <p className="text-amber-400 font-bold text-sm">⏳ تم إرسال الطلب بنجاح!</p>
                    <p className="text-slate-400 text-xs">جاري البحث عن سائق قريب منك...</p>
                  </div>
                )}

                {activeTrip.status === "accepted" && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                    <p className="text-emerald-400 font-bold text-sm">🛺🎉 تم قبول مشوارك من قبل السائق!</p>
                    <p className="text-slate-300 text-xs">السائق في طريقه إليك الآن.</p>
                  </div>
                )}

                {activeTrip.status === "completed" && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-center space-y-2">
                    <p className="text-blue-400 font-bold text-sm">🏁 تم إنهاء المشوار بنجاح!</p>
                    <p className="text-slate-300 text-xs">نتمنى لك رحلة سعيدة وموفقة.</p>
                  </div>
                )}

                {/* كارت تفاصيل المشوار للراكب (بدون حقول مدخلات طويلة) */}
                <div className="bg-[#0d1117] border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-slate-400">وسيلة النقل:</span>
                    <span className="font-bold text-amber-400">{activeTrip.vehicleType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">📍 من:</span>
                    <span className="text-slate-200">{activeTrip.pickup}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">🏁 إلى:</span>
                    <span className="text-slate-200">{activeTrip.destination}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                    <span className="text-slate-400">💰 السعر المقترح:</span>
                    <span className="font-bold text-amber-400 font-mono text-sm">{activeTrip.price}</span>
                  </div>
                </div>

                {activeTrip.status !== "completed" && (
                  <button
                    onClick={() => {
                      setActiveTrip(null);
                      setIsLoading(false);
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition border border-slate-700"
                  >
                    إلغاء الطلب / طلب جديد
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">📍 من (نقطة الانطلاق):</label>
                  <input
                    type="text"
                    required
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="مثال: الشرقي"
                    className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">🏁 إلى (الوجهة):</label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="مثال: حي المطار"
                    className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">🤝 السعر المقترح - مقاولة (اختياري):</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="أدخل السعر المبدئي بالجنيه"
                    className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">وسيلة النقل:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["ركشة", "توك توك", "تاكسي"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setVehicleType(type)}
                        className={`py-2 text-xs font-bold rounded-xl border transition ${
                          vehicleType === type
                            ? "bg-amber-500/10 border-amber-500 text-amber-400"
                            : "bg-[#0d1117] border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {type === "ركشة" && "🛺 "}
                        {type === "توك توك" && "🛺 "}
                        {type === "تاكسي" && "🚕 "}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span> جاري إرسال الطلب...
                    </>
                  ) : (
                    "طلب المشوار (مقاولة) 🔍"
                  )}
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
}
