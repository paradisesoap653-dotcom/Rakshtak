"use client";

import { useState, useEffect } from "react";
import Map from "@/components/Map";
import { supabase } from "@/lib/supabase";
import { normalizeSudanesePhone } from "@/lib/format";

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
  const [driverName, setDriverName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [isDriverLoggedIn, setIsDriverLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [isAvailable, setIsAvailable] = useState(true);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "current">("available");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPhone = localStorage.getItem("driver_phone");
      const savedName = localStorage.getItem("driver_name");
      const savedLicense = localStorage.getItem("driver_license");
      const savedBank = localStorage.getItem("driver_bank");
      const savedVehicle = localStorage.getItem("driver_vehicle");
      if (savedPhone && savedName && savedLicense) {
        setDriverPhone(savedPhone);
        setDriverName(savedName);
        setLicenseNumber(savedLicense);
        setBankAccount(savedBank || "");
        setVehicleType(savedVehicle || "");
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
    setLoginError(null);

    const fullPhone = normalizeSudanesePhone(driverPhone);
    if (!fullPhone) {
      setLoginError("رقم الهاتف السوداني غير صحيح (9 أرقام تبدأ بـ 9 أو 1)");
      return;
    }

    if (!driverName.trim()) {
      setLoginError("الاسم مطلوب");
      return;
    }

    if (!licenseNumber.trim()) {
      setLoginError("رقم الرخصة مطلوب");
      return;
    }

    localStorage.setItem("driver_phone", fullPhone);
    localStorage.setItem("driver_name", driverName.trim());
    localStorage.setItem("driver_license", licenseNumber.trim());
    localStorage.setItem("driver_bank", bankAccount.trim());
    localStorage.setItem("driver_vehicle", vehicleType.trim());
    setDriverPhone(fullPhone);
    setIsDriverLoggedIn(true);
  };

  const handleDriverLogout = () => {
    localStorage.removeItem("driver_phone");
    localStorage.removeItem("driver_name");
    localStorage.removeItem("driver_license");
    localStorage.removeItem("driver_bank");
    localStorage.removeItem("driver_vehicle");
    setIsDriverLoggedIn(false);
    setDriverPhone("");
    setDriverName("");
    setLicenseNumber("");
    setBankAccount("");
    setVehicleType("");
  };

  useEffect(() => {
    if (!isDriverLoggedIn) return;

    const fetchRides = async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .order("created_at", { ascending: false });

      // استبعاد المشواير الملغاة من القائمة
      const visible = (data || []).filter((r: any) => r.status !== "cancelled");

      if (!error && visible) {
        const pending = visible.filter((r: any) => r.status === "pending");
        const accepted = visible.find((r: any) => r.status === "accepted");
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
            const upd: any = payload.new;
            if (upd.status === "cancelled") {
              // الطلب اتلغى من الراكب: شيله من القايمة، ولو كان مشوارك الحالي بلّغ
              setAvailableRides((prev) => prev.filter((r) => r.id !== upd.id));
              setCurrentRide((cur) => {
                if (cur && cur.id === upd.id) {
                  alert("تم إلغاء المشوار ده من الراكب");
                  setActiveTab("available");
                  return null;
                }
                return cur;
              });
              return;
            }
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
    <div className="min-h-screen bg-gradient-to-b from-[#082f49] via-[#0c4a6e] to-[#0369a1] text-slate-100 p-4 flex flex-col justify-between w-full min-w-full">
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-between space-y-4">
        
        {/* الشريط العلوي */}
        <header className="flex justify-between items-center pt-2 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚖</span>
            <span className="font-extrabold text-xl text-white tracking-wide">لوحة السائق</span>
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = "/"; }}
            className="bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-400 font-bold text-sm px-4 py-2.5 rounded-xl border border-amber-500/30 transition flex items-center gap-2 shadow-lg"
          >
            <span>🛺</span> الرئيسية (الراكب)
          </button>
        </header>

        {!isDriverLoggedIn ? (
          <form onSubmit={handleDriverLogin} className="space-y-4 py-6 flex-1 flex flex-col justify-center">
            <div className="text-center space-y-1.5">
              <h2 className="text-lg font-bold text-white">دخول السائق 🚖</h2>
              <p className="text-xs text-slate-300">أدخل بياناتك للانضمام كسائق — الاسم ورقم الرخصة مطلوبان</p>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold rounded-xl px-3.5 py-3 text-center">
                ⚠️ {loginError}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block text-right">📞 رقم الهاتف:</label>
              
              <div 
                className="flex items-stretch border border-sky-700/60 rounded-xl overflow-hidden bg-[#0c4a6e] focus-within:border-amber-500"
                style={{ direction: 'ltr' }}
              >
                <div className="bg-[#075985] text-amber-400 px-3.5 py-3 text-sm font-mono font-bold border-r border-sky-700/60 flex items-center gap-1.5 select-none shrink-0">
                  <span>🇸🇩</span>
                  <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>+249</span>
                </div>

                <input
                  type="tel"
                  required
                  value={driverPhone.replace("+249", "")}
                  onChange={(e) => setDriverPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="9 أو 1 + 8 أرقام"
                  className="w-full bg-transparent px-3.5 py-3 text-sm text-white placeholder-slate-400 focus:outline-none font-mono text-left"
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block text-right">الاسم: *</label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="اسمك الكامل"
                  className="w-full bg-[#0c4a6e] border border-sky-700/60 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block text-right">🪪 رقم الرخصة: *</label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="رقم رخصة القيادة"
                  className="w-full bg-[#0c4a6e] border border-sky-700/60 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-400 focus:outline-none font-mono focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block text-right">🚗 نوع المركبة (اختياري):</label>
              <input
                type="text"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="مثال: ركشة / تكسي / توك توك"
                className="w-full bg-[#0c4a6e] border border-sky-700/60 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block text-right">🏦 رقم الحساب البنكي (اختياري):</label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="أدخل رقم الحساب البنكي لتحويل المستحقات"
                className="w-full bg-[#0c4a6e] border border-sky-700/60 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-400 focus:outline-none font-mono text-right focus:border-amber-500"
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
            <div className="flex items-center justify-between bg-[#0c4a6e] p-3 rounded-2xl border border-sky-800/70 gap-2">
              <div className="text-xs text-slate-300 space-y-1">
                <div>👤 {driverName} {vehicleType && <span className="text-slate-400">— {vehicleType}</span>}</div>
                <div>📞 هاتف: <span className="font-mono text-amber-400 font-bold" style={{ direction: "ltr", display: "inline-block" }}>{driverPhone}</span></div>
                {bankAccount && <div>🏦 الحساب: <span className="font-mono text-amber-400 font-bold">{bankAccount}</span></div>}
              </div>
              <button
                onClick={handleDriverLogout}
                className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20 transition shrink-0"
              >
                تغيير البيانات
              </button>
            </div>

            {/* حالة التواجد */}
            <div className="flex justify-between items-center bg-[#0c4a6e] p-3 rounded-2xl border border-sky-800/70">
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
            <div className="w-full h-44 rounded-2xl overflow-hidden border border-sky-700/40 shadow-xl shrink-0">
              <Map pickupName={currentRide ? currentRide.pickup_location : "موقعي الحالي"} />
            </div>

            {/* تبويب الطلبات والمشوار الحالي */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab("available")}
                className={`py-3 text-xs font-extrabold rounded-xl border transition ${
                  activeTab === "available"
                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md"
                    : "bg-[#0c4a6e] text-slate-400 border-sky-800/70 hover:text-white"
                }`}
              >
                الطلبات المتاحة 🔔 ({availableRides.length})
              </button>
              <button
                onClick={() => setActiveTab("current")}
                className={`py-3 text-xs font-extrabold rounded-xl border transition ${
                  activeTab === "current"
                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md"
                    : "bg-[#0c4a6e] text-slate-400 border-sky-800/70 hover:text-white"
                }`}
              >
                المشوار الحالي 🚖 {currentRide ? "(1)" : "(0)"}
              </button>
            </div>

            {/* المحتوى */}
            {activeTab === "available" ? (
              <div className="space-y-3 flex-1">
                {availableRides.length === 0 ? (
                  <div className="text-center py-8 bg-[#0c4a6e] border border-sky-800/70 rounded-2xl text-slate-400 text-xs font-medium">
                    لا توجد طلبات متاحة حالياً. انتظر قليلاً... ⏳
                  </div>
                ) : (
                  availableRides.map((ride) => (
                    <div key={ride.id} className="bg-[#0c4a6e] border border-sky-700/70 rounded-2xl p-4 space-y-3 shadow-lg">
                      <div className="flex justify-between items-center text-xs border-b border-sky-800/70 pb-2.5">
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
                        <div className="text-slate-300 flex items-center justify-between pt-1">
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
                  <div className="text-center py-8 bg-[#0c4a6e] border border-sky-800/70 rounded-2xl text-slate-400 text-xs font-medium">
                    لا توجد رحلة حالية قيد التنفيذ.
                  </div>
                ) : (
                  <div className="bg-[#0c4a6e] border border-sky-700/70 rounded-2xl p-4 space-y-3.5 shadow-lg">
                    <div className="flex justify-between items-center text-xs border-b border-sky-800/70 pb-2.5">
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
                      <div className="text-slate-300 flex items-center justify-between pt-1">
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
                        className="py-2.5 bg-[#075985] hover:bg-[#0284c7] text-slate-200 text-center text-xs font-bold rounded-xl border border-sky-700/60 transition"
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
