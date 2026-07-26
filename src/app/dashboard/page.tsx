"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";

// استدعاء مكون الخريطة ديناميكياً لتفادي أخطاء العرض في السيرفر (SSR)
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-[#181C1F] rounded-2xl flex items-center justify-center text-xs text-amber-500 animate-pulse border border-neutral-800">
      🗺️ جاري تحميل خريطة عطبرة...
    </div>
  ),
});

export default function DashboardPage() {
  const [step, setStep] = useState<"main_map" | "booking" | "edit_location">("main_map");

  // بيانات المستخدم والموقع
  const [userName] = useState("تاج السر حسن");
  const [addressName, setAddressName] = useState("العمل");
  const [addressCode] = useState("P262+R7V, عطبرة");
  const [showNoServiceError, setShowNoServiceError] = useState(false);

  // إعدادات الرحلة والمسار
  const [userRole, setUserRole] = useState<"rider" | "driver">("rider");
  const [selectedVehicle, setSelectedVehicle] = useState("raksha");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bankak">("bankak");

  // حالات رحلة الراكب
  const [isBooking, setIsBooking] = useState(false);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [rideStatus, setRideStatus] = useState<"searching" | "accepted" | "arrived" | "in_trip" | "completed">("searching");
  const [rating, setRating] = useState(5);

  // حالات رحلة السائق
  const [isOnline, setIsOnline] = useState(true);
  const [incomingRides, setIncomingRides] = useState<any[]>([]);
  const [activeDriverRide, setActiveDriverRide] = useState<any | null>(null);
  const [driverTripState, setDriverTripState] = useState<"idle" | "heading_to_client" | "on_trip" | "finished">("idle");

  // ================= 1. الربط مع Supabase للراكب =================
  const handleCreateRide = async () => {
    setIsBooking(true);
    setRideStatus("searching");

    const { data, error } = await supabase
      .from("rides")
      .insert([
        {
          passenger_name: userName,
          passenger_phone: "0912345678",
          pickup_location: "ود إلياس / عطبرة",
          destination: "السوق الكبير",
          price: selectedVehicle === "raksha" ? 1500 : selectedVehicle === "tuk_tuk" ? 2500 : 3500,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("خطأ في إنشاء الطلب:", error.message);
    } else if (data) {
      setCurrentRideId(data.id);
    }
  };

  // الاستماع لتحديث حالة طلب الراكب الحالي
  useEffect(() => {
    if (!currentRideId) return;

    const channel = supabase
      .channel(`ride_${currentRideId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${currentRideId}` },
        (payload) => {
          const newStatus = payload.new.status;
          if (newStatus === "accepted") setRideStatus("accepted");
          if (newStatus === "arrived") setRideStatus("arrived");
          if (newStatus === "in_trip") setRideStatus("in_trip");
          if (newStatus === "completed") setRideStatus("completed");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRideId]);

  // ================= 2. الربط مع Supabase للسائق (Realtime) =================
  useEffect(() => {
    if (userRole !== "driver" || !isOnline) return;

    // جلب الطلبات المعلقة
    const fetchPendingRides = async () => {
      const { data } = await supabase.from("rides").select("*").eq("status", "pending").order("created_at", { ascending: false });
      if (data) setIncomingRides(data);
    };

    fetchPendingRides();

    // الاستماع الفوري للطلبات الجديدة
    const channel = supabase
      .channel("driver_realtime_rides")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rides" },
        (payload) => {
          if (payload.new.status === "pending") {
            setIncomingRides((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole, isOnline]);

  // قبول السائق للطلب
  const handleAcceptRide = async (ride: any) => {
    const { error } = await supabase.from("rides").update({ status: "accepted" }).eq("id", ride.id);

    if (!error) {
      setActiveDriverRide(ride);
      setIncomingRides((prev) => prev.filter((r) => r.id !== ride.id));
      setDriverTripState("heading_to_client");
    }
  };

  // تحديث حالة رحلة السائق
  const updateDriverRideStatus = async (newStatus: string, nextTripState: any) => {
    if (!activeDriverRide) return;

    const { error } = await supabase.from("rides").update({ status: newStatus }).eq("id", activeDriverRide.id);

    if (!error) {
      setDriverTripState(nextTripState);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between p-4 dir-rtl font-sans select-none">
      
      {/* 1. الشاشة الرئيسية مع الخريطة التفاعلية */}
      {step === "main_map" && (
        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <div className="bg-[#1E1E1E] border border-neutral-800 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400">
              👤 {userName}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("booking")}
                className="bg-[#EE6C20] hover:bg-[#d85e19] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              >
                🛺 طلب مشوار
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl relative">
            <Map center={[17.7022, 33.9822]} pickupName="ود إلياس / عطبرة" />
          </div>

          <div className="bg-[#1E1E1E] p-4 rounded-3xl border border-neutral-800 space-y-3 shadow-2xl">
            <button
              onClick={() => setStep("booking")}
              className="w-full bg-[#EE6C20] hover:bg-[#d85e19] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-orange-500/20"
            >
              <span>🛺</span>
              <span>الانتقال لواجهة الطلب والحالة</span>
            </button>

            <div className="flex gap-2 overflow-x-auto py-1">
              <button
                onClick={() => setStep("booking")}
                className="flex items-center gap-2 bg-[#2A2A2A] hover:bg-neutral-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-neutral-700"
              >
                <span>🏠</span>
                <span>المنزل</span>
              </button>

              <button
                onClick={() => setStep("edit_location")}
                className="flex items-center gap-2 bg-[#2A2A2A] hover:bg-neutral-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-neutral-700"
              >
                <span>💼</span>
                <span>إضافة مكان العمل</span>
              </button>

              <button
                onClick={() => setShowNoServiceError(!showNoServiceError)}
                className="bg-[#2A2A2A] hover:bg-neutral-700 p-2.5 rounded-xl text-xs border border-neutral-700"
              >
                ➕
              </button>
            </div>

            {showNoServiceError && (
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-2xl flex justify-between items-center text-xs text-red-400">
                <span>⚠️ لا توجد خدمة تغطية متوفرة في هذه المنطقة حالياً</span>
                <button onClick={() => setShowNoServiceError(false)} className="text-white font-bold px-2">
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. شاشة تعديل المكان */}
      {step === "edit_location" && (
        <div className="my-auto space-y-6 max-w-sm mx-auto w-full px-2">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">تعديل الموقع المفضّل</h1>
            <button
              onClick={() => setStep("main_map")}
              className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 bg-[#1E1E1E] p-4 rounded-2xl border border-neutral-800">
            <div className="space-y-1">
              <label className="text-xs text-neutral-500 block">العنوان الجغرافي</label>
              <p className="text-sm font-bold text-neutral-300">{addressCode}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#EE6C20] font-bold block">اسم المكان</label>
              <input
                type="text"
                value={addressName}
                onChange={(e) => setAddressName(e.target.value)}
                className="w-full bg-transparent border-b border-[#EE6C20] py-2 text-base text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => setStep("main_map")}
            className="w-full bg-[#EE6C20] hover:bg-[#d85e19] text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-500/20 text-sm"
          >
            حفظ المكان 📍
          </button>
        </div>
      )}

      {/* 3. شاشة إدارة الطلبات والتفاعل */}
      {step === "booking" && (
        <div className="my-auto space-y-4 max-w-sm mx-auto w-full">
          <div className="flex justify-between items-center bg-[#1E1E1E] p-3 rounded-2xl border border-neutral-800">
            <button onClick={() => setStep("main_map")} className="text-xs font-bold text-[#EE6C20]">
              ← عودة للخريطة
            </button>
            <div className="flex gap-1 text-xs bg-[#121212] p-1 rounded-xl">
              <button
                onClick={() => setUserRole("rider")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  userRole === "rider" ? "bg-[#EE6C20] text-white font-bold" : "text-neutral-400"
                }`}
              >
                راكب
              </button>
              <button
                onClick={() => setUserRole("driver")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  userRole === "driver" ? "bg-[#EE6C20] text-white font-bold" : "text-neutral-400"
                }`}
              >
                سائق
              </button>
            </div>
          </div>

          {userRole === "rider" ? (
            !isBooking ? (
              <div className="space-y-4">
                <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-neutral-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">📍</span>
                    <input
                      type="text"
                      defaultValue="ود إلياس / عطبرة"
                      className="bg-transparent w-full focus:outline-none text-sm text-neutral-200"
                    />
                  </div>
                  <hr className="border-neutral-800" />
                  <div className="flex items-center gap-3">
                    <span className="text-[#EE6C20] text-lg">🔍</span>
                    <input
                      type="text"
                      defaultValue="السوق الكبير"
                      className="bg-transparent w-full focus:outline-none text-sm text-neutral-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "raksha", name: "ركشة", price: "1,500 ج.س", icon: "🛺" },
                    { id: "tuk_tuk", name: "توك توك", price: "2,500 ج.س", icon: "🛺" },
                    { id: "taxi", name: "تكسي", price: "3,500 ج.س", icon: "🚕" },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVehicle(v.id)}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                        selectedVehicle === v.id
                          ? "border-[#EE6C20] bg-[#EE6C20]/10 text-white"
                          : "border-neutral-800 bg-[#1E1E1E] text-neutral-400"
                      }`}
                    >
                      <span className="text-2xl">{v.icon}</span>
                      <span className="font-bold text-xs">{v.name}</span>
                      <span className="text-xs text-[#EE6C20]">{v.price}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCreateRide}
                  className="w-full bg-[#EE6C20] hover:bg-[#d85e19] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20 text-base"
                >
                  تأكيد وطلب الرحلة 🚀
                </button>
              </div>
            ) : rideStatus !== "completed" ? (
              <div className="space-y-4">
                <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-[#EE6C20]/30 text-center space-y-3">
                  <div className="text-4xl animate-bounce">
                    {rideStatus === "searching" && "⏳"}
                    {rideStatus === "accepted" && "🛺"}
                    {rideStatus === "arrived" && "📍"}
                    {rideStatus === "in_trip" && "🏁"}
                  </div>
                  <h2 className="text-lg font-bold text-[#EE6C20]">
                    {rideStatus === "searching" && "جاري البحث عن أقرب ركشة..."}
                    {rideStatus === "accepted" && "تم قبول الطلب! السائق في الطريق إليك"}
                    {rideStatus === "arrived" && "وصل السائق إلى موقعك!"}
                    {rideStatus === "in_trip" && "الرحلة مستمرة إلى الوجهة..."}
                  </h2>
                </div>

                {rideStatus !== "searching" && (
                  <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-neutral-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-base">محمد أحمد (السائق)</h3>
                        <p className="text-xs text-neutral-400">ركشة • 45892</p>
                      </div>
                      <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">
                        ★ 4.9
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setIsBooking(false)}
                  className="w-full bg-red-600/20 text-red-400 border border-red-500/30 py-3 rounded-2xl font-bold text-xs"
                >
                  إلغاء الرحلة
                </button>
              </div>
            ) : (
              <div className="bg-[#1E1E1E] p-6 rounded-3xl border border-[#EE6C20]/30 space-y-5 text-center">
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-3xl mx-auto">
                  🎉
                </div>
                <div>
                  <h2 className="text-xl font-bold">وصلت بالسلامة!</h2>
                </div>

                <div className="space-y-2 text-right">
                  <label className="text-xs text-neutral-400 font-bold block">طريقة الدفع</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod("bankak")}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                        paymentMethod === "bankak"
                          ? "border-[#EE6C20] bg-[#EE6C20]/10 text-[#EE6C20]"
                          : "border-neutral-800 bg-[#121212] text-neutral-400"
                      }`}
                    >
                      <span>📲</span>
                      <span>تطبيق بنكك</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                        paymentMethod === "cash"
                          ? "border-[#EE6C20] bg-[#EE6C20]/10 text-[#EE6C20]"
                          : "border-neutral-800 bg-[#121212] text-neutral-400"
                      }`}
                    >
                      <span>💵</span>
                      <span>نقداً (كاش)</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsBooking(false);
                    setStep("main_map");
                  }}
                  className="w-full bg-[#EE6C20] hover:bg-[#d85e19] text-white font-bold py-3.5 rounded-2xl text-sm"
                >
                  إتمام والدفع 💳
                </button>
              </div>
            )
          ) : (
            /* واجهة السائق الحقيقية المرتبطة بـ Supabase */
            <div className="space-y-4">
              <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-neutral-800 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">حالة السائق</p>
                  <p className="text-xs text-neutral-400">{isOnline ? "مستعد لاستقبال الطلبات" : "غير متصل"}</p>
                </div>
                <button
                  onClick={() => setIsOnline(!isOnline)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {isOnline ? "🟢 متصل" : "🔴 غير متصل"}
                </button>
              </div>

              {/* قائمة الطلبات الحقيقية المباشرة من Supabase */}
              {isOnline && driverTripState === "idle" && (
                <div className="space-y-3">
                  {incomingRides.length === 0 ? (
                    <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-neutral-800 text-center text-xs text-neutral-400 animate-pulse">
                      ⏳ في انتظار طلبات جديدة...
                    </div>
                  ) : (
                    incomingRides.map((ride) => (
                      <div key={ride.id} className="bg-[#1E1E1E] border-2 border-[#EE6C20] p-4 rounded-2xl space-y-3 shadow-xl">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#EE6C20] text-sm">طلب مشوار جديد 🛺</span>
                          <span className="text-xs bg-[#EE6C20] text-white px-2 py-0.5 rounded font-bold">
                            {ride.price} ج.س
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300">
                          الراكب: {ride.passenger_name}
                          <br />
                          من: {ride.pickup_location} 📍 إلى: {ride.destination} 🔍
                        </p>
                        <button
                          onClick={() => handleAcceptRide(ride)}
                          className="w-full bg-green-500 text-black font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-green-500/20"
                        >
                          قبول الطلب ✅
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* رحلة السائق الحالية */}
              {driverTripState === "heading_to_client" && (
                <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-blue-500/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-400 font-bold">توجه للراكب 📍</span>
                    <span className="text-xs text-neutral-400">الراكب: {activeDriverRide?.passenger_name}</span>
                  </div>
                  <p className="text-sm font-bold">الموقع: {activeDriverRide?.pickup_location}</p>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button className="bg-neutral-800 text-xs py-2.5 rounded-xl text-neutral-300 font-bold">
                      📞 اتصال بالراكب
                    </button>
                    <button
                      onClick={() => updateDriverRideStatus("arrived", "on_trip")}
                      className="bg-[#EE6C20] text-white font-bold text-xs py-2.5 rounded-xl"
                    >
                      وصلت للراكب 🛺
                    </button>
                  </div>
                </div>
              )}

              {driverTripState === "on_trip" && (
                <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[#EE6C20]/30 space-y-3">
                  <span className="text-xs text-[#EE6C20] font-bold">الرحلة مستمرة 🏁</span>
                  <p className="text-sm font-bold">الوجهة: {activeDriverRide?.destination}</p>
                  <button
                    onClick={() => updateDriverRideStatus("completed", "finished")}
                    className="w-full bg-green-500 text-black font-bold py-3 rounded-xl text-xs"
                  >
                    إنهاء الرحلة وتحصيل ({activeDriverRide?.price} ج.س) 💰
                  </button>
                </div>
              )}

              {driverTripState === "finished" && (
                <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-green-500/30 text-center space-y-3">
                  <span className="text-3xl">✅</span>
                  <p className="font-bold text-sm">تم إتمام الرحلة بنجاح!</p>
                  <button
                    onClick={() => {
                      setDriverTripState("idle");
                      setActiveDriverRide(null);
                    }}
                    className="w-full bg-neutral-800 text-white font-bold py-2.5 rounded-xl text-xs"
                  >
                    استقبال طلبات جديدة 🔄
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
