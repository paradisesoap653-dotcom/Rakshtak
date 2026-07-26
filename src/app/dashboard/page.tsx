"use client";

import { useState, useEffect } from "react";

export default function RiderDashboardPage() {
  // 1. إدارة الوضع: راكب (rider) أو سائق (driver)
  const [userRole, setUserRole] = useState<"rider" | "driver">("rider");

  // --- حالات الراكب ---
  const [selectedVehicle, setSelectedVehicle] = useState("raksha");
  const [isBooking, setIsBooking] = useState(false);
  const [rideStatus, setRideStatus] = useState<"searching" | "accepted" | "arrived" | "completed">("searching");
  const [rating, setRating] = useState(5);

  // --- حالات السائق ---
  const [isOnline, setIsOnline] = useState(false);
  const [hasIncomingRequest, setHasIncomingRequest] = useState(false);
  const [driverTripState, setDriverTripState] = useState<"idle" | "heading_to_client" | "on_trip">("idle");

  // محاكاة تنقل حالة رحلة الراكب
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

  // محاكاة وصول طلب جديد للسائق بعد تشغيل "متصل"
  useEffect(() => {
    if (userRole === "driver" && isOnline && driverTripState === "idle") {
      const timer = setTimeout(() => setHasIncomingRequest(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [userRole, isOnline, driverTripState]);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between p-4 dir-rtl font-sans">
      
      {/* 1. الترويسة العلوية + زر التبديل بين الراكب والسائق */}
      <div className="bg-[#1E1E1E] p-3 rounded-2xl border border-gray-800 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 text-black p-2 rounded-xl font-bold">🛺</div>
            <span className="font-bold text-lg">ركشتك</span>
          </div>
          <div className="bg-[#2A2A2A] text-amber-400 font-bold px-3 py-1.5 rounded-xl text-sm border border-amber-500/20">
            👛 {userRole === "rider" ? "4,500 ج.س" : "12,800 ج.س"}
          </div>
        </div>

        {/* محول الدور */}
        <div className="grid grid-cols-2 bg-[#121212] p-1 rounded-xl border border-gray-800 text-xs text-center font-bold">
          <button
            onClick={() => setUserRole("rider")}
            className={`py-2 rounded-lg transition-all ${
              userRole === "rider" ? "bg-amber-500 text-black" : "text-gray-400"
            }`}
          >
            👤 وضع الراكب
          </button>
          <button
            onClick={() => setUserRole("driver")}
            className={`py-2 rounded-lg transition-all ${
              userRole === "driver" ? "bg-amber-500 text-black" : "text-gray-400"
            }`}
          >
            🛺 وضع السائق
          </button>
        </div>
      </div>

      {/* 2. واجهة الراكب (Rider View) */}
      {userRole === "rider" && (
        <div className="my-auto space-y-4">
          {!isBooking ? (
            /* اختيار المركبة والطلب */
            <div className="space-y-4">
              <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-gray-800 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">📍</span>
                  <input
                    type="text"
                    defaultValue="الموقع الحالي (السوق الشعبي)"
                    className="bg-transparent w-full focus:outline-none text-sm text-gray-200"
                  />
                </div>
                <hr className="border-gray-800" />
                <div className="flex items-center gap-3">
                  <span className="text-amber-500 text-xl">🔍</span>
                  <input
                    type="text"
                    placeholder="إلى أين تريد الذهاب؟ (أدخل الوجهة)"
                    className="bg-transparent w-full focus:outline-none text-sm text-gray-400"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400 px-1">اختر نوع المركبة:</p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "raksha", name: "ركشة", price: "1,500 ج.س", icon: "🛺" },
                  { id: "tuk_tuk", name: "توك توك مغلق", price: "2,200 ج.س", icon: "🛺" },
                  { id: "motor", name: "موتر توصيل", price: "1,000 ج.س", icon: "🏍️" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedVehicle(item.id)}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                      selectedVehicle === item.id
                        ? "border-amber-500 bg-amber-500/10 text-white"
                        : "border-gray-800 bg-[#1E1E1E] text-gray-400"
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-bold text-sm">{item.name}</span>
                    <span className="text-xs text-amber-400">{item.price}</span>
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
                تأكيد وطلب الرحلة 🛺
              </button>
            </div>
          ) : rideStatus !== "completed" ? (
            /* تتبع الرحلة والسائق */
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
                  {rideStatus === "arrived" && "السائق وصل في الموقع الحالي"}
                </h2>
              </div>

              {rideStatus !== "searching" && (
                <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-gray-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">محمد أحمد</h3>
                      <p className="text-xs text-gray-400">ركشة خضراء • رقم اللوحة: 45892</p>
                    </div>
                    <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full">
                      ★ 4.9
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-green-600 hover:bg-green-700 py-2.5 rounded-xl text-sm font-bold">
                      📞 اتصال بالسائق
                    </button>
                    <button className="flex-1 bg-[#2A2A2A] hover:bg-gray-700 py-2.5 rounded-xl text-sm font-bold">
                      💬 مراسلة
                    </button>
                  </div>
                </div>
              )}

              {rideStatus === "arrived" ? (
                <button
                  onClick={() => setRideStatus("completed")}
                  className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3.5 rounded-2xl"
                >
                  إنهاء الرحلة والدفع ✅
                </button>
              ) : (
                <button
                  onClick={() => setIsBooking(false)}
                  className="w-full bg-red-600/20 text-red-400 border border-red-500/30 py-3 rounded-2xl font-bold"
                >
                  إلغاء الرحلة
                </button>
              )}
            </div>
          ) : (
            /* شاشة التقيم والدفع بعد اكتمال الرحلة */
            <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-amber-500/30 text-center space-y-5">
              <div className="text-5xl">🎉</div>
              <h2 className="text-xl font-bold text-amber-400">وصلت بالسلامة!</h2>
              <p className="text-sm text-gray-400">المبلغ المطلوب: <span className="text-white font-bold">1,500 ج.س</span></p>

              <div className="space-y-2">
                <p className="text-xs text-gray-300">كيف كانت تجربتك مع السائق؟</p>
                <div className="flex justify-center gap-2 text-2xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={star <= rating ? "text-amber-400" : "text-gray-600"}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setIsBooking(false);
                  setRideStatus("searching");
                }}
                className="w-full bg-amber-500 text-black font-bold py-3.5 rounded-2xl"
              >
                إرسال التقييم والعودة للرئيسية
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. واجهة السائق (Driver View) */}
      {userRole === "driver" && (
        <div className="my-auto space-y-4">
          {/* زر الاتصال واستقبال الطلبات */}
          <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-gray-800 flex justify-between items-center">
            <div>
              <p className="font-bold text-sm">حالة السائق الآن</p>
              <p className="text-xs text-gray-400">{isOnline ? "مستعد لاستقبال الطلبات" : "غير متصل"}</p>
            </div>
            <button
              onClick={() => {
                setIsOnline(!isOnline);
                setHasIncomingRequest(false);
                setDriverTripState("idle");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isOnline ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {isOnline ? "🟢 متصل" : "🔴 غير متصل"}
            </button>
          </div>

          {!isOnline && (
            <div className="bg-[#1E1E1E] p-8 rounded-2xl border border-gray-800 text-center space-y-2 text-gray-400">
              <span className="text-4xl block">💤</span>
              <p className="text-sm font-bold">اضغط على زر "متصل" للبدء في استقبال طلبات الركاب.</p>
            </div>
          )}

          {/* تنبيه وصول طلب جديد */}
          {isOnline && hasIncomingRequest && driverTripState === "idle" && (
            <div className="bg-amber-500/10 border-2 border-amber-500 p-5 rounded-2xl space-y-4 animate-pulse">
              <div className="flex justify-between items-center">
                <span className="bg-amber-500 text-black text-xs font-bold px-2.5 py-1 rounded-full">طلب جديد! 🛺</span>
                <span className="text-amber-400 font-bold text-sm">1,500 ج.س</span>
              </div>
              <div>
                <p className="font-bold text-sm text-white">الراكب: عثمان علي</p>
                <p className="text-xs text-gray-400">من: السوق الشعبي 📍</p>
                <p className="text-xs text-gray-400">إلى: السوق الكبير 🏁</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setHasIncomingRequest(false);
                    setDriverTripState("heading_to_client");
                  }}
                  className="flex-1 bg-green-500 text-black font-bold py-3 rounded-xl text-sm"
                >
                  قبول الطلب ✅
                </button>
                <button
                  onClick={() => setHasIncomingRequest(false)}
                  className="flex-1 bg-gray-800 text-gray-300 font-bold py-3 rounded-xl text-sm"
                >
                  رفض
                </button>
              </div>
            </div>
          )}

          {/* تتبع تنفيذ الرحلة من جهة السائق */}
          {driverTripState !== "idle" && (
            <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-gray-800 space-y-4">
              <div className="text-center space-y-1">
                <span className="text-3xl block">📍</span>
                <h3 className="font-bold text-amber-400">
                  {driverTripState === "heading_to_client" ? "في الطريق للراكب (السوق الشعبي)" : "الرحلة مستمرة إلى الوجهة"}
                </h3>
              </div>

              {driverTripState === "heading_to_client" ? (
                <button
                  onClick={() => setDriverTripState("on_trip")}
                  className="w-full bg-amber-500 text-black font-bold py-3.5 rounded-xl text-sm"
                >
                  وصلت للراكب / بدء الرحلة 🚀
                </button>
              ) : (
                <button
                  onClick={() => {
                    setDriverTripState("idle");
                    setHasIncomingRequest(false);
                  }}
                  className="w-full bg-green-500 text-black font-bold py-3.5 rounded-xl text-sm"
                >
                  إنهاء الرحلة واستلام 1,500 ج.س 💵
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. الشريط السفلي */}
      <div className="flex justify-around bg-[#1E1E1E] p-3 rounded-2xl border border-gray-800 text-gray-400 text-xs">
        <button className="flex flex-col items-center text-amber-400 gap-1">
          <span className="text-lg">🏠</span>
          <span>الرئيسية</span>
        </button>
        <button className="flex flex-col items-center gap-1 hover:text-white">
          <span className="text-lg">📜</span>
          <span>الرحلات</span>
        </button>
        <button className="flex flex-col items-center gap-1 hover:text-white">
          <span className="text-lg">👤</span>
          <span>حسابي</span>
        </button>
      </div>

    </div>
  );
}
