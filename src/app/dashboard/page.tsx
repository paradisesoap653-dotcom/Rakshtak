"use "use client";

import { useState, useEffect } from "react";

export default function HomePage() {
  const [selectedVehicle, setSelectedVehicle] = useState("raksha");
  const [isBooking, setIsBooking] = useState(false);
  const [rideStatus, setRideStatus] = useState<"searching" | "accepted" | "arrived">("searching");

  // محاكاة تغيير حالة الرحلة تلقائياً بعد تأكيد الطلب
  useEffect(() => {
    if (isBooking) {
      const timer1 = setTimeout(() => setRideStatus("accepted"), 3000);
      const timer2 = setTimeout(() => setRideStatus("arrived"), 7000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isBooking]);

  const handleStartBooking = () => {
    setRideStatus("searching");
    setIsBooking(true);
  };

  const handleCancel = () => {
    setIsBooking(false);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between p-4 dir-rtl font-sans">
      {/* 1. الترويسة العلوية */}
      <div className="flex justify-between items-center bg-[#1E1E1E] p-3 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 text-black p-2 rounded-xl font-bold">🛺</div>
          <span className="font-bold text-lg">ركشتك</span>
        </div>
        <div className="bg-[#2A2A2A] text-amber-400 font-bold px-3 py-1.5 rounded-xl text-sm border border-amber-500/20">
          👛 4,500 ج.س
        </div>
      </div>

      {/* 2. المحتوى المتغير (إما خيارات المركبة أو شاشة التتبع) */}
      {!isBooking ? (
        /* --- واجهة اختيار المركبة والطلب --- */
        <div className="space-y-4 my-auto">
          {/* عناوين المواقع */}
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

          {/* قائمة المركبات */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedVehicle("raksha")}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                selectedVehicle === "raksha"
                  ? "border-amber-500 bg-amber-500/10 text-white"
                  : "border-gray-800 bg-[#1E1E1E] text-gray-400"
              }`}
            >
              <span className="text-2xl">🛺</span>
              <span className="font-bold text-sm">ركشة</span>
              <span className="text-xs text-amber-400">1,500 ج.س</span>
            </button>

            <button
              onClick={() => setSelectedVehicle("tuk_tuk")}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                selectedVehicle === "tuk_tuk"
                  ? "border-amber-500 bg-amber-500/10 text-white"
                  : "border-gray-800 bg-[#1E1E1E] text-gray-400"
              }`}
            >
              <span className="text-2xl">🛺</span>
              <span className="font-bold text-sm">توك توك مغلق</span>
              <span className="text-xs text-amber-400">2,200 ج.س</span>
            </button>

            <button
              onClick={() => setSelectedVehicle("motor")}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                selectedVehicle === "motor"
                  ? "border-amber-500 bg-amber-500/10 text-white"
                  : "border-gray-800 bg-[#1E1E1E] text-gray-400"
              }`}
            >
              <span className="text-2xl">🏍️</span>
              <span className="font-bold text-sm">موتر توصيل</span>
              <span className="text-xs text-amber-400">1,000 ج.س</span>
            </button>
          </div>

          {/* زر التأكيد */}
          <button
            onClick={handleStartBooking}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 rounded-2xl transition-colors text-base shadow-lg shadow-amber-500/10"
          >
            تأكيد وطلب الرحلة 🛺
          </button>
        </div>
      ) : (
        /* --- واجهة تتبع الرحلة والسائق --- */
        <div className="space-y-4 my-auto">
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
                <button className="flex-1 bg-green-600 hover:bg-green-700 py-2.5 rounded-xl text-sm font-bold transition-colors">
                  📞 اتصال بالسائق
                </button>
                <button className="flex-1 bg-[#2A2A2A] hover:bg-gray-700 py-2.5 rounded-xl text-sm font-bold transition-colors">
                  💬 مراسلة
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleCancel}
            className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 py-3 rounded-2xl font-bold transition-colors"
          >
            إلغاء الرحلة
          </button>
        </div>
      )}

      {/* 3. شريط التنقل السفلي */}
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
