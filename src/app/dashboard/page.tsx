"use client";

import { useState, useEffect } from "react";

export default function TirhalApp() {
  // إدارة الشاشات
  const [step, setStep] = useState<
    "privacy" | "location_permission" | "profile_setup" | "main_map" | "edit_location" | "booking"
  >("privacy");

  // بيانات المستخدم والموقع
  const [userName, setUserName] = useState("تاج السر حسن");
  const [referralCode, setReferralCode] = useState("1234");
  const [locationType, setLocationType] = useState<"precise" | "approx">("precise");
  const [addressName, setAddressName] = useState("العمل");
  const [addressCode, setAddressCode] = useState("P262+R7V, عطبرة");
  const [showNoServiceError, setShowNoServiceError] = useState(false);

  // إدارة نظام الرحلة والسائق
  const [userRole, setUserRole] = useState<"rider" | "driver">("rider");
  const [selectedVehicle, setSelectedVehicle] = useState("raksha");
  const [isBooking, setIsBooking] = useState(false);
  const [rideStatus, setRideStatus] = useState<"searching" | "accepted" | "arrived" | "completed">("searching");
  const [rating, setRating] = useState(5);

  // حالات السائق
  const [isOnline, setIsOnline] = useState(false);
  const [hasIncomingRequest, setHasIncomingRequest] = useState(false);
  const [driverTripState, setDriverTripState] = useState<"idle" | "heading_to_client" | "on_trip">("idle");

  // محاكاة حالة رحلة الراكب
  useEffect(() => {
    if (isBooking && rideStatus === "searching") {
      const timer1 = setTimeout(() => setRideStatus("accepted"), 3000);
      const timer2 = setTimeout(() => setRideStatus("arrived"), 7000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isBooking, rideStatus]);

  // محاكاة طلب السائق
  useEffect(() => {
    if (userRole === "driver" && isOnline && driverTripState === "idle") {
      const timer = setTimeout(() => setHasIncomingRequest(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [userRole, isOnline, driverTripState]);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between p-4 dir-rtl font-sans select-none">
      
      {/* 1. شاشة إشعار الخصوصية */}
      {step === "privacy" && (
        <div className="my-auto bg-[#1E1E1E] p-6 rounded-3xl border border-neutral-800 space-y-6 text-center max-w-sm mx-auto shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center text-3xl mx-auto">
            🛡️
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">إشعار الخصوصية</h2>
            <p className="text-xs text-neutral-400 leading-relaxed px-2">
              يجمع تطبيق ركشتك بيانات الموقع لتفعيل تتبُّع مسارك خلال الرحلة فقط، حتى عندما يكون التطبيق مغلقًا أو غير مُستخدَم.
            </p>
          </div>
          <button
            onClick={() => setStep("location_permission")}
            className="w-full bg-[#EE6C20] hover:bg-[#d85e19] text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-500/20 text-sm"
          >
            موافق
          </button>
        </div>
      )}

      {/* 2. شاشة إذن الموقع الجغرافي */}
      {step === "location_permission" && (
        <div className="my-auto bg-[#1E1E1E] p-6 rounded-3xl border border-neutral-800 space-y-6 max-w-sm mx-auto shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center text-2xl mx-auto">
              📍
            </div>
            <h2 className="text-sm font-bold text-neutral-200">
              السماح لتطبيق ركشتك بالوصول إلى الموقع الجغرافي لهذا الجهاز؟
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 py-2">
            <button
              onClick={() => setLocationType("approx")}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 ${
                locationType === "approx" ? "border-amber-500 bg-amber-500/10" : "border-neutral-800 bg-[#121212]"
              }`}
            >
              <div className="w-12 h-12 rounded-full border border-dashed border-amber-500 flex items-center justify-center text-xs text-amber-500">
                🌐
              </div>
              <span className="text-xs font-bold">تقريبي</span>
            </button>

            <button
              onClick={() => setLocationType("precise")}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 ${
                locationType === "precise" ? "border-amber-500 bg-amber-500/10" : "border-neutral-800 bg-[#121212]"
              }`}
            >
              <div className="w-12 h-12 rounded-full border-2 border-amber-500 flex items-center justify-center text-xs text-amber-500">
                🎯
              </div>
              <span className="text-xs font-bold">دقيق</span>
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setStep("profile_setup")}
              className="w-full bg-[#121212] hover:bg-neutral-800 py-3 rounded-xl text-xs font-bold border border-neutral-700"
            >
              أثناء استخدام التطبيق
            </button>
            <button
              onClick={() => setStep("profile_setup")}
              className="w-full bg-[#121212] hover:bg-neutral-800 py-3 rounded-xl text-xs font-bold border border-neutral-700"
            >
              هذه المرة فقط
            </button>
          </div>
        </div>
      )}

      {/* 3. شاشة إدخال البيانات الشخصية */}
      {step === "profile_setup" && (
        <div className="my-auto space-y-8 max-w-sm mx-auto w-full px-2">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">أضف بعض المعلومات الشخصية</h1>
            <button onClick={() => setStep("main_map")} className="text-sm text-neutral-400 hover:text-white">
              حفظ
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl text-neutral-400">
              👤
            </div>
            <button className="text-sm font-bold text-neutral-300">إضافة صورة</button>
          </div>

          <div className="space-y-6 pt-4">
            <div className="space-y-1">
              <label className="text-xs text-amber-500 font-bold block">الاسم</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-transparent border-b border-amber-500 py-2 text-base text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-neutral-500 block">رمز الإحالة إن وجد</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full bg-transparent border-b border-neutral-800 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-10">
            <button
              onClick={() => setStep("main_map")}
              className="w-full bg-[#EE6C20] hover:bg-[#d85e19] text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-500/20 text-sm"
            >
              متابعة 🚀
            </button>
          </div>
        </div>
      )}

      {/* 4. شاشة الخريطة الرئيسية والأماكن المفضلة */}
      {step === "main_map" && (
        <div className="relative flex-1 flex flex-col justify-between -m-4 p-4 min-h-screen bg-[#181C1F]">
          <div className="absolute inset-0 bg-[#15191C] flex flex-col items-center justify-center text-neutral-700 space-y-3">
            <div className="w-48 h-48 rounded-full border border-neutral-800 flex items-center justify-center bg-neutral-900/30">
              <span className="text-4xl animate-pulse">📍</span>
            </div>
            <p className="text-xs text-neutral-500">خريطة الموقع الحالية (ود إلياس / عطبرة)</p>
          </div>

          <div className="relative z-10 flex justify-between items-center">
            <button
              onClick={() => setStep("profile_setup")}
              className="w-10 h-10 bg-neutral-900/80 backdrop-blur rounded-full flex items-center justify-center border border-neutral-700 text-lg"
            >
              ☰
            </button>
            <div className="bg-[#1E1E1E] border border-neutral-800 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400">
              👤 {userName}
            </div>
          </div>

          {/* الكارت السفلي - تفعيل زر طلب الرحلة */}
          <div className="relative z-10 bg-[#1E1E1E] p-4 rounded-3xl border border-neutral-800 space-y-4 shadow-2xl">
            {/* زر طلب الرحلة المفعل */}
            <button
              onClick={() => setStep("booking")}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-base transition-all shadow-lg shadow-amber-500/20"
            >
              <span>🛺</span>
              <span>طلب رحلة الآن</span>
            </button>

            <div className="flex gap-2 overflow-x-auto py-1">
              <button
                onClick={() => setStep("booking")}
                className="flex items-center gap-2 bg-[#2A2A2A] hover:bg-neutral-700 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border border-neutral-700"
              >
                <span>🏠</span>
                <span>المنزل</span>
              </button>

              <button
                onClick={() => setStep("edit_location")}
                className="flex items-center gap-2 bg-[#2A2A2A] hover:bg-neutral-700 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border border-neutral-700"
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
                <span>⚠️ لا توجد خدمة في هذه المنطقة</span>
                <button onClick={() => setShowNoServiceError(false)} className="text-white font-bold px-2">
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. شاشة تعديل المكان */}
      {step === "edit_location" && (
        <div className="my-auto space-y-6 max-w-sm mx-auto w-full px-2">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">تعديل الموقع</h1>
            <button onClick={() => setStep("main_map")} className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm">
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-neutral-500 block">العنوان</label>
              <p className="text-sm font-bold text-neutral-300">{addressCode}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-amber-500 font-bold block">الاسم</label>
              <input
                type="text"
                value={addressName}
                onChange={(e) => setAddressName(e.target.value)}
                className="w-full bg-transparent border-b border-amber-500 py-2 text-base text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => setStep("main_map")}
            className="w-full bg-[#EE6C20] hover:bg-[#d85e19] text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-500/20 text-sm mt-6"
          >
            حفظ المكان 📍
          </button>
        </div>
      )}

      {/* 6. واجهة اختيار الرحلة والتتبع (السائق والراكب) */}
      {step === "booking" && (
        <div className="my-auto space-y-4 max-w-sm mx-auto w-full">
          {/* زر الرجوع والتبديل */}
          <div className="flex justify-between items-center bg-[#1E1E1E] p-3 rounded-2xl border border-gray-800">
            <button onClick={() => setStep("main_map")} className="text-xs font-bold text-amber-400">
              ← عودة للخريطة
            </button>
            <div className="flex gap-1 text-xs bg-[#121212] p-1 rounded-xl">
              <button
                onClick={() => setUserRole("rider")}
                className={`px-3 py-1 rounded-lg ${userRole === "rider" ? "bg-amber-500 text-black font-bold" : "text-gray-400"}`}
              >
                راكب
              </button>
              <button
                onClick={() => setUserRole("driver")}
                className={`px-3 py-1 rounded-lg ${userRole === "driver" ? "bg-amber-500 text-black font-bold" : "text-gray-400"}`}
              >
                سائق
              </button>
            </div>
          </div>

          {userRole === "rider" ? (
            !isBooking ? (
              <div className="space-y-4">
                <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-gray-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-xl">📍</span>
                    <input type="text" defaultValue="ود إلياس / عطبرة" className="bg-transparent w-full focus:outline-none text-sm text-gray-200" />
                  </div>
                  <hr className="border-gray-800" />
                  <div className="flex items-center gap-3">
                    <span className="text-amber-500 text-xl">🔍</span>
                    <input type="text" defaultValue="السوق الكبير" className="bg-transparent w-full focus:outline-none text-sm text-gray-200" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "raksha", name: "ركشة (مشوار)", price: "1,500 ج.س", icon: "🛺" },
                    { id: "tuk_tuk", name: "توك توك (بضاعة)", price: "2,500 ج.س", icon: "🛺" },
                    { id: "taxi", name: "تكسي (ترحال)", price: "3,500 ج.س", icon: "🚕" },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVehicle(v.id)}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1 ${
                        selectedVehicle === v.id ? "border-amber-500 bg-amber-500/10 text-white" : "border-gray-800 bg-[#1E1E1E] text-gray-400"
                      }`}
                    >
                      <span className="text-2xl">{v.icon}</span>
                      <span className="font-bold text-xs">{v.name}</span>
                      <span className="text-xs text-amber-400">{v.price}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setRideStatus("searching");
                    setIsBooking(true);
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 rounded-2xl transition-colors text-base"
                >
                  تأكيد وطلب الرحلة 🚀
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-amber-500/30 text-center space-y-3">
                  <div className="text-4xl animate-bounce">
                    {rideStatus === "searching" && "⏳"}
                    {rideStatus === "accepted" && "🛺"}
                    {rideStatus === "arrived" && "📍"}
                  </div>
                  <h2 className="text-lg font-bold text-amber-400">
                    {rideStatus === "searching" && "جاري البحث عن أقرب ركشة..."}
                    {rideStatus === "accepted" && "تم قبول الطلب! السائق في الطريق إليك"}
                    {rideStatus === "arrived" && "وصل السائق في الموقع الحالي"}
                  </h2>
                </div>

                {rideStatus !== "searching" && (
                  <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-gray-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-base">محمد أحمد</h3>
                        <p className="text-xs text-gray-400">ركشة خضراء • لوحة: 45892</p>
                      </div>
                      <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">★ 4.9</span>
                    </div>
                  </div>
                )}

                <button onClick={() => setIsBooking(false)} className="w-full bg-red-600/20 text-red-400 border border-red-500/30 py-3 rounded-2xl font-bold">
                  إلغاء الرحلة
                </button>
              </div>
            )
          ) : (
            /* وضع السائق */
            <div className="space-y-4">
              <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-gray-800 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">حالة السائق</p>
                  <p className="text-xs text-gray-400">{isOnline ? "مستعد لاستقبال الطلبات" : "غير متصل"}</p>
                </div>
                <button
                  onClick={() => setIsOnline(!isOnline)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${isOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                >
                  {isOnline ? "🟢 متصل" : "🔴 غير متصل"}
                </button>
              </div>

              {isOnline && hasIncomingRequest && (
                <div className="bg-amber-500/10 border-2 border-amber-500 p-4 rounded-2xl space-y-3">
                  <p className="font-bold text-amber-400 text-sm">طلب جديد! (عطبرة 📍)</p>
                  <button
                    onClick={() => setHasIncomingRequest(false)}
                    className="w-full bg-green-500 text-black font-bold py-2.5 rounded-xl text-xs"
                  >
                    قبول الطلب ✅
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
