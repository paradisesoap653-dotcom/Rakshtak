"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-900/50 animate-pulse flex items-center justify-center text-xs text-slate-500 rounded-2xl border border-slate-800">
      جاري تحميل الخريطة...
    </div>
  ),
});

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"passenger" | "driver">("passenger");
  const [pickup, setPickup] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [offeredPrice, setOfferedPrice] = useState<number>(1500);
  const [loading, setLoading] = useState<boolean>(false);

  // إدارة الدخول ورقم الهاتف
  const [userPhone, setUserPhone] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [phoneInput, setPhoneInput] = useState<string>("");

  // الصوت
  const audioCtxRef = useRef<AudioContext | null>(null);

  // الرحلات
  const [activeRide, setActiveRide] = useState<any>(null);
  const [pendingRides, setPendingRides] = useState<any[]>([]);
  const previousRidesCount = useRef<number>(0);

  // التقييم
  const [showRating, setShowRating] = useState<boolean>(false);

  // تهيئة الصوت ورقم الهاتف المحفوظ
  useEffect(() => {
    const savedPhone = localStorage.getItem("rakshatak_user_phone");
    if (savedPhone) {
      setUserPhone(savedPhone);
      setIsLoggedIn(true);
    }

    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };

    window.addEventListener("click", initAudio, { once: true });
    return () => window.removeEventListener("click", initAudio);
  }, []);

  // تشغيل الصوت
  const playNotificationSound = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (err) {
      console.log("Audio Error:", err);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || phoneInput.length < 8) {
      alert("الرجاء إدخال رقم هاتف صحيح");
      return;
    }
    localStorage.setItem("rakshatak_user_phone", phoneInput);
    setUserPhone(phoneInput);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("rakshatak_user_phone");
    setUserPhone("");
    setIsLoggedIn(false);
    setActiveRide(null);
  };

  // المزامنة الدورية للرحلات (للسائق وللراكب)
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/rides");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.rides)) {
          const allRides = data.rides;

          // 1. تحديث قائمة الطلبات المتاحة للسائقين
          const pending = allRides.filter((r: any) => r.status === "pending");
          if (pending.length > previousRidesCount.current) {
            playNotificationSound();
          }
          previousRidesCount.current = pending.length;
          setPendingRides(pending);

          // 2. تحديث حالة الرحلة للراكب أو السائق في الوقت الفعلي
          if (userPhone) {
            const currentActive = allRides.find(
              (r: any) =>
                (r.passenger_phone === userPhone ||
                  r.passengerPhone === userPhone ||
                  r.driver_phone === userPhone ||
                  r.driverPhone === userPhone) &&
                (r.status === "pending" || r.status === "accepted")
            );

            if (currentActive) {
              setActiveRide(currentActive);
            } else if (activeRide && activeRide.status !== "completed") {
              // إذا انتهت أو أُلغيت
              setActiveRide(null);
            }
          }
        }
      }
    } catch (error) {
      console.error("خطأ في تحديث البيانات:", error);
    }
  }, [userPhone, activeRide]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // تحديث كل 3 ثوانٍ
    return () => clearInterval(interval);
  }, [fetchData]);

  // إنشـاء الطلب من الراكب
  const handleCreateRide = async () => {
    if (!pickup || !destination) {
      alert("الرجاء إدخال نقطة الانطلاق والوجهة");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: "raksha",
          pickupLocation: pickup,
          destination: destination,
          offeredPrice: offeredPrice,
          passengerPhone: userPhone,
          passenger_phone: userPhone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveRide(data.ride);
        fetchData();
      } else {
        alert(`فشل الإرسال: ${data.error || "خطأ في السيرفر"}`);
      }
    } catch (error: any) {
      alert(`خطأ في الاتصال: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // قبول الطلب من السائق
  const handleAcceptRide = async (ride: any) => {
    try {
      const res = await fetch("/api/rides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rideId: ride.id,
          status: "accepted",
          driverPhone: userPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveRide(data.ride);
        fetchData();
      } else {
        alert(`تعذر قبول الطلب: ${data.error}`);
      }
    } catch (error: any) {
      alert(`خطأ في الاتصال: ${error.message}`);
    }
  };

  const handleCompleteRide = async () => {
    if (!activeRide) return;
    try {
      await fetch("/api/rides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId: activeRide.id, status: "completed" }),
      });
      setShowRating(true);
    } catch (error) {
      console.error("Error completing ride:", error);
    }
  };

  const handleSubmitRating = () => {
    setShowRating(false);
    setActiveRide(null);
    setPickup("");
    setDestination("");
  };

  const extractPassengerPhone = (rideObj: any) => {
    if (!rideObj) return "";
    return rideObj.passenger_phone || rideObj.passengerPhone || "";
  };

  const extractDriverPhone = (rideObj: any) => {
    if (!rideObj) return "";
    return rideObj.driver_phone || rideObj.driverPhone || "";
  };

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#0a0c10] text-white flex flex-col items-center justify-center p-4 font-sans" dir="rtl">
        <div className="w-full max-w-md bg-[#12161f] border border-slate-800 p-6 rounded-3xl space-y-6 text-center shadow-2xl">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center mx-auto text-4xl">
            🛺
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">مرحباً بك في ركشتك</h1>
            <p className="text-xs text-slate-400">أدخل رقم هاتفك للبدء واستخدام التطبيق</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="tel"
              required
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="مثال: 0912345678"
              className="w-full bg-[#0a0c10] border border-slate-800 rounded-2xl p-4 text-center text-lg font-bold text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
            />
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
            >
              دخول واستمرار 🚀
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0c10] text-white flex flex-col items-center justify-start p-4 font-sans" dir="rtl">
      {/* شريط حساب المستخدم */}
      <div className="w-full max-w-md bg-[#12161f] border border-slate-800/80 px-4 py-2.5 rounded-2xl mb-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-400">حسابك:</span>
          <span className="font-bold text-amber-400" dir="ltr">{userPhone}</span>
        </div>
        <button onClick={handleLogout} className="text-[10px] text-slate-500 hover:text-red-400 underline">
          تغيير الرقم
        </button>
      </div>

      {/* التبديل بين الراكب والسائق */}
      <div className="w-full max-w-md bg-[#12161f] p-1.5 rounded-2xl flex border border-slate-800/80 mb-6 shadow-lg">
        <button
          onClick={() => setActiveTab("passenger")}
          className={`flex-1 py-3 text-sm font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "passenger" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md" : "text-slate-400"
          }`}
        >
          <span>🙋‍♂️</span> راكب
        </button>
        <button
          onClick={() => setActiveTab("driver")}
          className={`flex-1 py-3 text-sm font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "driver" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md" : "text-slate-400"
          }`}
        >
          <span>🛺</span> سائق
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* واجهة الراكب */}
        {activeTab === "passenger" && (
          <>
            {showRating ? (
              <div className="bg-[#12161f] border border-slate-800 p-6 rounded-3xl text-center space-y-5 shadow-2xl">
                <h3 className="text-xl font-black text-white">وصلت بسلامة الله!</h3>
                <button onClick={handleSubmitRating} className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-2xl">
                  إغلاق
                </button>
              </div>
            ) : activeRide ? (
              <div className="bg-[#12161f] border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-amber-400">
                    {activeRide.status === "accepted" ? "تم قبول طلبك! السائق في الطريق 🚀" : "جاري البحث عن سائق قريب... ⏳"}
                  </h3>
                </div>
                
                <div className="h-44 rounded-2xl overflow-hidden border border-slate-800">
                  <DynamicMap center={[17.7022, 33.9822]} pickupName={activeRide.pickup_location || activeRide.pickupLocation} />
                </div>

                <div className="bg-[#0a0c10] p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الانطلاق:</span>
                    <span className="font-bold text-white">{activeRide.pickup_location || activeRide.pickupLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الوجهة:</span>
                    <span className="font-bold text-white">{activeRide.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">السعر:</span>
                    <span className="font-bold text-emerald-400">{activeRide.offered_price || activeRide.offeredPrice} ج.س</span>
                  </div>
                </div>

                {/* الاتصال بالسائق للراكب */}
                {extractDriverPhone(activeRide) ? (
                  <a
                    href={`tel:${extractDriverPhone(activeRide)}`}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm animate-bounce"
                  >
                    <span>📞</span> الاتصال بالسائق ({extractDriverPhone(activeRide)})
                  </a>
                ) : (
                  <div className="text-center text-xs text-amber-400 py-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    ⏳ بانتظار قبول أي سائق للرحلة لظهر رقمه هنا...
                  </div>
                )}

                <button onClick={handleCompleteRide} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl text-xs">
                  ✅ اكتملت الرحلة
                </button>
              </div>
            ) : (
              <div className="bg-[#12161f] border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black text-white">تفاصيل المشوار 🛺</h2>
                </div>

                <div className="h-48 rounded-2xl overflow-hidden border border-slate-800">
                  <DynamicMap center={[17.7022, 33.9822]} pickupName={pickup || "عطبرة"} />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">من (نقطة الانطلاق)</label>
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="مثال: عطبرة - السياله"
                      className="w-full bg-[#0a0c10] border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">إلى (الوجهة)</label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="مثال: المربعات"
                      className="w-full bg-[#0a0c10] border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateRide}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-2xl shadow-lg text-sm mt-2"
                >
                  {loading ? "جاري الإرسال..." : "🚀 تأكيد وطلب الرحلة"}
                </button>
              </div>
            )}
          </>
        )}

        {/* واجهة السائق */}
        {activeTab === "driver" && (
          <div className="bg-[#12161f] border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
            {activeRide && (activeRide.driver_phone === userPhone || activeRide.driverPhone === userPhone) ? (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-amber-400 text-center">مشوار جاري حالياً 🚀</h3>
                
                <div className="h-44 rounded-2xl overflow-hidden border border-slate-800">
                  <DynamicMap center={[17.7022, 33.9822]} pickupName={activeRide.pickup_location || activeRide.pickupLocation} />
                </div>

                <div className="bg-[#0a0c10] p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">نقطة الانطلاق:</span>
                    <span className="font-bold text-white">{activeRide.pickup_location || activeRide.pickupLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الوجهة:</span>
                    <span className="font-bold text-white">{activeRide.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المبلغ:</span>
                    <span className="font-bold text-emerald-400">{activeRide.offered_price || activeRide.offeredPrice} ج.س</span>
                  </div>
                </div>

                {extractPassengerPhone(activeRide) ? (
                  <a
                    href={`tel:${extractPassengerPhone(activeRide)}`}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <span>📞</span> الاتصال بالراكب ({extractPassengerPhone(activeRide)})
                  </a>
                ) : (
                  <div className="text-center text-xs text-red-400 py-2">لا يوجد رقم هاتف للراكب</div>
                )}

                <button onClick={handleCompleteRide} className="w-full py-3.5 bg-emerald-600 text-white font-extrabold rounded-2xl text-sm">
                  ✅ إنهاء المشوار والتوصيل
                </button>
              </div>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black text-white">طلبات الرحلات المتاحة 🛺</h2>
                </div>

                {pendingRides.length === 0 ? (
                  <div className="bg-[#0a0c10] border border-slate-800/80 rounded-2xl p-8 text-center space-y-2">
                    <p className="text-2xl">⏳</p>
                    <p className="text-xs text-slate-400">لا توجد طلبات رحلات جديدة حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRides.map((ride) => {
                      const pPhone = extractPassengerPhone(ride);
                      return (
                        <div key={ride.id} className="bg-[#0a0c10] border border-slate-800/80 p-4 rounded-2xl space-y-3">
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-white">
                              <span className="text-slate-400">من:</span>
                              <span className="font-bold">{ride.pickup_location || ride.pickupLocation}</span>
                            </div>
                            <div className="flex justify-between text-white">
                              <span className="text-slate-400">إلى:</span>
                              <span className="font-bold">{ride.destination}</span>
                            </div>
                            <div className="flex justify-between text-amber-400 font-bold pt-1">
                              <span>السعر المقترح:</span>
                              <span>{ride.offered_price || ride.offeredPrice} ج.س</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {pPhone ? (
                              <a
                                href={`tel:${pPhone}`}
                                className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1"
                              >
                                <span>📞</span> اتصال ({pPhone})
                              </a>
                            ) : (
                              <button disabled className="py-2.5 bg-slate-800 text-slate-500 text-xs rounded-xl">
                                بلا رقم
                              </button>
                            )}

                            <button
                              onClick={() => handleAcceptRide(ride)}
                              className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-md"
                            >
                              قبول الطلب ✅
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
