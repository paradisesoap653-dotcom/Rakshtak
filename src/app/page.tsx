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

export default function DriverDashboard() {
  const [driverPhone, setDriverPhone] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [isDriverLoggedIn, setIsDriverLoggedIn] = useState(false);

  const [isAvailable, setIsAvailable] = useState(true);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "current">("available");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPhone = localStorage.getItem("driver_phone");
      const savedBank = localStorage.getItem("driver_bank");
      if (savedPhone) {
        setDriverPhone(savedPhone);
        setBankAccount(savedBank || "");
        setIsDriverLoggedIn(true);
      }
    }
  }, []);

  // 1. طلب إذن الإشعارات بأمان
  useEffect(() => {
    if (isDriverLoggedIn && typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().catch(() => {});
    }
  }, [isDriverLoggedIn]);

  // 2. تشغيل التنبيه الصوتي والإشعار عند وصول طلب جديد
  useEffect(() => {
    if (availableRides.length > 0 && isDriverLoggedIn && typeof window !== "undefined") {
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.play().catch(() => {});

        if ("Notification" in window && Notification.permission === "granted") {
          const latestRide = availableRides[0];
          new Notification("طلب مشوار جديد! 🛺", {
            body: `من: ${latestRide.pickup_location || "الموقع"} - إلى: ${latestRide.destination || "الوجهة"}`,
            icon: "/icon.png",
          });
        }
      } catch (err) {
        console.log("Audio notification error:", err);
      }
    }
  }, [availableRides.length, isDriverLoggedIn]);

  const handleDriverLogin = (e: React.FormEvent) => {
    e.preventDefault();
    let val = driverPhone.replace(/\D/g, "");
    if (val.startsWith("0")) val = val.slice(1);

    if (val.length < 9) {
      alert("الرجاء إدخال رقم هاتف سوداني صحيح (9 أرقام)");
      return;
    }

    if (!bankAccount.trim()) {
      alert("الرجاء إدخال رقم الحساب البنكي لتحويل المستحقات");
      return;
    }

    const fullPhone = `+249${val}`;
    localStorage.setItem("driver_phone", fullPhone);
    localStorage.setItem("driver_bank", bankAccount);
    setDriverPhone(fullPhone);
    setIsDriverLoggedIn(true);
  };

  const handleDriverLogout = () => {
    localStorage.removeItem("driver_phone");
    localStorage.removeItem("driver_bank");
    setIsDriverLoggedIn(false);
    setDriverPhone("");
    setBankAccount("");
  };

  useEffect(() => {
    if (!isDriverLoggedIn) return;

    const fetchRides = async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const pending = data.filter((r) => r.status === "pending");
        const accepted = data.find((r) => r.status === "accepted");
        setAvailableRides(pending);
        if (accepted) setCurrentRide(accepted);
      }
    };

    fetchRides();

    const channel = supabase
      .channel("driver-rides-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rides" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newRide = payload.new as Ride;
            if (newRide.status === "pending") {
              setAvailableRides((prev) => [newRide, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Ride;
            if (updated.status === "pending") {
              setAvailableRides((prev) =>
                prev.map((r) => (r.id === updated.id ? updated : r))
              );
            } else if (updated.status === "accepted") {
              setAvailableRides((prev) => prev.filter((r) => r.id !== updated.id));
              if (currentRide?.id === updated.id || !currentRide) {
                setCurrentRide(updated);
              }
            } else if (updated.status === "completed") {
              if (currentRide?.id === updated.id) {
                setCurrentRide(null);
                setActiveTab("available");
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDriverLoggedIn, currentRide]);

  const acceptRide = async (ride: Ride) => {
    const { error } = await supabase
      .from("rides")
      .update({ 
        status: "accepted",
        driver_phone: driverPhone 
      })
      .eq("id", ride.id);

    if (error) {
      alert("خطأ أثناء قبول الطلب: " + error.message);
    } else {
      const updatedRide = { ...ride, status: "accepted" as const, driver_phone: driverPhone };
      setCurrentRide(updatedRide);
      setActiveTab("current");
    }
  };

  const completeRide = async (rideId: string) => {
    const { error } = await supabase
      .from("rides")
      .update({ status: "completed" })
      .eq("id", rideId);

    if (error) {
      alert("خطأ أثناء إنهاء المشوار: " + error.message);
    } else {
      setCurrentRide(null);
      setActiveTab("available");
    }
  };

  return (
    <div className="min-h-screen bg-[#161b22] text-slate-100 p-4 flex flex-col justify-between w-full min-w-full">
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-between space-y-4">
        
        {/* الشريط العلوي مع زر إجباري للتنقل عبر JavaScript */}
        <header className="flex justify-between items-center pt-2 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚖</span>
            <span className="font-extrabold text-xl text-white tracking-wide">لوحة السائق</span>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.replace("/");
            }}
            className="bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-400 font-bold text-sm px-4 py-2.5 rounded-xl border border-amber-500/40 transition flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <span>🛺</span> الرئيسية (الراكب)
          </button>
        </header>

        {!isDriverLoggedIn ? (
          <form onSubmit={handleDriverLogin} className="space-y-5 py-8 flex-1 flex flex-col justify-center">
            <div className="text-center space-y-1.5">
              <h2 className="text-lg font-bold text-white">تسجيل دخول السائق 🚖</h2>
              <p className="text-xs text-slate-400">أدخل رقم هاتفك وحسابك البنكي للمتابعة</p>
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
                  value={driverPhone.replace("+249", "")}
                  onChange={(e) => setDriverPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="9XXXXXXXX"
                  className="w-full bg-transparent px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none font-mono text-left"
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block text-right">🏦 رقم الحساب البنكي (بنكك/صكوك):</label>
              <input
                type="text"
                required
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="أدخل رقم الحساب البنكي"
                className="w-full bg-[#0d1117] border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none font-mono text-right focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-extrabold rounded-2xl text-base shadow-xl transition mt-2"
            >
              دخول لوحة السائق 🚀
            </button>
          </form>
        ) : (
          <>
            {/* شريط معلومات السائق */}
            <div className="flex items-center justify-between bg-[#0d1117] p-3 rounded-2xl border border-slate-800">
              <div className="text-xs text-slate-300 space-y-1">
                <div>📞 هاتف: <span className="font-mono text-amber-400 font-bold" style={{ direction: "ltr", display: "inline-block" }}>{driverPhone}</span></div>
                <div>🏦 الحساب: <span className="font-mono text-amber-400 font-bold">{bankAccount}</span></div>
              </div>
              <button
                onClick={handleDriverLogout}
                className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20 transition"
              >
                تغيير البيانات
              </button>
            </div>

            {/* حالة التواجد */}
            <div className="flex justify-between items-center bg-[#0d1117] p-3 rounded-2xl border border-slate-800">
              <span className="text-sm font-semibold text-slate-300">حالة التواجد:</span>
              <button
                onClick={() => setIsAvailable(!isAvailable)}
                className={`text-xs px-4 py-2 rounded-xl font-extrabold transition flex items-center gap-2 ${
                  isAvailable
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/10 text-red-400 border border-red-500/30"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? "bg-emerald-400" : "bg-red-400"}`}></span>
                {isAvailable ? "متاح للطلبات 🟢" : "مشغول / استراحة 🔴"}
              </button>
            </div>

            {/* الخريطة */}
            <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl shrink-0">
              <Map pickupName={currentRide ? currentRide.pickup_location : "موقعي الحالي"} />
            </div>

            {/* تبويب الطلبات والمشوار الحالي */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab("available")}
                className={`py-3 text-xs font-extrabold rounded-xl border transition ${
                  activeTab === "available"
                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md"
                    : "bg-[#0d1117] text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                الطلبات المتاحة 🔔 ({availableRides.length})
              </button>
              <button
                onClick={() => setActiveTab("current")}
                className={`py-3 text-xs font-extrabold rounded-xl border transition ${
                  activeTab === "current"
                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md"
                    : "bg-[#0d1117] text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                المشوار الحالي 🚖 {currentRide ? "(1)" : "(0)"}
              </button>
            </div>

            {/* المحتوى */}
            {activeTab === "available" ? (
              <div className="space-y-3 flex-1">
                {availableRides.length === 0 ? (
                  <div className="text-center py-10 bg-[#0d1117] border border-slate-800 rounded-2xl text-slate-500 text-xs font-medium">
                    لا توجد طلبات متاحة حالياً. انتظر قليلاً... ⏳
                  </div>
                ) : (
                  availableRides.map((ride) => (
                    <div key={ride.id} className="bg-[#0d1117] border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-lg">
                      <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2.5">
                        <span className="font-bold text-white text-sm">👤 {ride.passenger_name}</span>
                        <span className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold">
                          {ride.service_type || "ركشة ركاب"}
                        </span>
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-300">
                        <div>📍 من: <span className="text-white font-semibold">{ride.pickup_location}</span></div>
                        <div>🏁 إلى: <span className="text-white font-semibold">{ride.destination}</span></div>
                        {ride.offered_price && (
                          <div className="text-amber-400 font-bold font-mono text-sm">
                            💰 السعر المقترح: <span style={{ direction: "ltr", display: "inline-block" }}>{ride.offered_price} ج.س</span>
                          </div>
                        )}
                        <div className="text-slate-400 flex items-center justify-between pt-1">
                          <span>📞 الهاتف:</span>
                          <a 
                            href={`tel:${ride.phone_number}`} 
                            className="font-mono text-amber-400 hover:underline font-bold text-sm" 
                            style={{ direction: "ltr" }}
                          >
                            {ride.phone_number}
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => acceptRide(ride)}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition"
                      >
                        قبول المشوار ✅
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {!currentRide ? (
                  <div className="text-center py-10 bg-[#0d1117] border border-slate-800 rounded-2xl text-slate-500 text-xs font-medium">
                    لا توجد رحلة حالية قيد التنفيذ.
                  </div>
                ) : (
                  <div className="bg-[#0d1117] border border-slate-700/80 rounded-2xl p-4 space-y-3.5 shadow-lg">
                    <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2.5">
                      <span className="font-bold text-emerald-400 text-sm">🟢 مشوار جاري</span>
                      <span className="font-bold text-white text-sm">👤 {currentRide.passenger_name}</span>
                    </div>
                    <div className="text-xs space-y-1.5 text-slate-300">
                      <div>📍 من: <span className="text-white font-semibold">{currentRide.pickup_location}</span></div>
                      <div>🏁 إلى: <span className="text-white font-semibold">{currentRide.destination}</span></div>
                      {currentRide.offered_price && (
                        <div className="text-amber-400 font-bold font-mono text-sm">
                          💰 السعر المقترح: <span style={{ direction: "ltr", display: "inline-block" }}>{currentRide.offered_price} ج.س</span>
                        </div>
                      )}
                      <div className="text-slate-400 flex items-center justify-between pt-1">
                        <span>📞 الهاتف:</span>
                        <a 
                          href={`tel:${currentRide.phone_number}`} 
                          className="font-mono text-amber-400 hover:underline font-bold text-sm" 
                          style={{ direction: "ltr" }}
                        >
                          {currentRide.phone_number}
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={`tel:${currentRide.phone_number}`}
                        className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-center text-xs font-bold rounded-xl border border-slate-700 transition"
                      >
                        اتصال بالزبون 📞
                      </a>
                      <a
                        href={`https://wa.me/${currentRide.phone_number.replace("+", "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-center text-xs font-bold rounded-xl border border-emerald-500/30 transition"
                      >
                        واتساب 💬
                      </a>
                    </div>

                    <button
                      onClick={() => completeRide(currentRide.id)}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition"
                    >
                      إكمال / إنهاء المشوار 🏁
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
