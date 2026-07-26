"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState("raksha"); // raksha, tuktuk, taxi

  const handleOrder = () => {
    // الانتقال لصفحة كتابة العناوين مع التوجيه للخدمة المختارة
    router.push(`/request?type=ride&vehicle=${selectedVehicle}`);
  };

  return (
    <main className="min-h-screen flex flex-col justify-between px-6 py-8 bg-black text-white">
      {/* شريط التنقل العلوي بين الراكب والسائق */}
      <div className="flex justify-between items-center bg-gray-900 p-2 rounded-2xl border border-gray-800">
        <div className="flex gap-1">
          <button className="px-5 py-2 rounded-xl bg-orange-500 font-bold text-sm">
            راكب
          </button>
          <button 
            onClick={() => router.push('/driver')} 
            className="px-5 py-2 rounded-xl text-gray-400 font-bold text-sm hover:text-white"
          >
            سائق
          </button>
        </div>
        <span className="text-sm text-gray-400 pl-2">← عودة للخريطة</span>
      </div>

      {/* قسم اختيار وسيلة النقل */}
      <div className="my-auto py-8">
        <h2 className="text-xl font-bold text-center mb-6 text-gray-200">
          اختر وسيلة النقل
        </h2>

        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
          {/* ركشة */}
          <button
            onClick={() => setSelectedVehicle("raksha")}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
              selectedVehicle === "raksha"
                ? "border-orange-500 bg-orange-500/10"
                : "border-gray-800 bg-gray-900 opacity-60"
            }`}
          >
            <span className="text-3xl mb-1">🛺</span>
            <span className="font-bold text-sm">ركشة</span>
            <span className="text-xs text-orange-400 mt-1 font-semibold">1,500 ج.س</span>
          </button>

          {/* توك توك */}
          <button
            onClick={() => setSelectedVehicle("tuktuk")}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
              selectedVehicle === "tuktuk"
                ? "border-orange-500 bg-orange-500/10"
                : "border-gray-800 bg-gray-900 opacity-60"
            }`}
          >
            <span className="text-3xl mb-1">🛺</span>
            <span className="font-bold text-sm">توك توك</span>
            <span className="text-xs text-orange-400 mt-1 font-semibold">2,500 ج.س</span>
          </button>

          {/* تكسي */}
          <button
            onClick={() => setSelectedVehicle("taxi")}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
              selectedVehicle === "taxi"
                ? "border-orange-500 bg-orange-500/10"
                : "border-gray-800 bg-gray-900 opacity-60"
            }`}
          >
            <span className="text-3xl mb-1">🚕</span>
            <span className="font-bold text-sm">تكسي</span>
            <span className="text-xs text-orange-400 mt-1 font-semibold">3,500 ج.س</span>
          </button>
        </div>
      </div>

      {/* زر طلب الرحلة */}
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={handleOrder}
          className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
        >
          🚀 تحديد نقطة الانطلاق والوجهة
        </button>
      </div>
    </main>
  );
}
