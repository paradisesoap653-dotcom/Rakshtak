"use client";

import { useState } from "react";
import Map from "@/components/Map";

export default function PassengerPage() {
  const [vehicleType, setVehicleType] = useState<"ركشة" | "توك توك" | "تاكسي">("ركشة");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-max-w-md bg-[#161b22] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        
        {/* الهيدر مع معلومات المستخدم */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛺</span>
            <div>
              <h1 className="font-bold text-lg text-white">ركشتك</h1>
              <p className="text-[10px] text-slate-400">عطبرة، السودان</p>
            </div>
          </div>
          <span className="text-xs bg-slate-800 text-amber-400 px-3 py-1 rounded-full border border-slate-700">
            مسافر_9060 🖐️
          </span>
        </div>

        {/* الخريطة التفاعلية */}
        <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
          <Map pickupName={pickup || "حدد موقعك"} />
        </div>

        {/* حقول تحديد المسار */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">📍 من (نقطة الانطلاق):</label>
            <input
              type="text"
              placeholder="مثال: السوق الكبير - عطبرة"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full bg-[#0d1117] border border-slate-700 focus:border-amber-500 text-white rounded-xl p-3 text-sm outline-none transition"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">🏁 إلى (الوجهة):</label>
            <input
              type="text"
              placeholder="مثال: حي المطار / بربر"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-[#0d1117] border border-slate-700 focus:border-amber-500 text-white rounded-xl p-3 text-sm outline-none transition"
            />
          </div>

          {/* اقتراح السعر (نظام الفصال) */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">🤝 السعر المقترح - مقاولة (اختياري):</label>
            <div className="relative">
              <input
                type="number"
                placeholder="أدخل السعر المبدئي بالجنيه"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                className="w-full bg-[#0d1117] border border-slate-700 focus:border-amber-500 text-white rounded-xl p-3 text-sm outline-none transition pl-12"
              />
              <span className="absolute left-3 top-3 text-xs text-slate-500 font-bold">ج.س</span>
            </div>
          </div>
        </div>

        {/* تحديد نوع المركبة بدون أرقام أسعار ثابتة */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">وسيلة النقل:</label>
          <div className="grid grid-cols-3 gap-2">
            {(["ركشة", "توك توك", "تاكسي"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setVehicleType(type)}
                className={`py-3 rounded-xl font-bold text-xs border transition-all ${
                  vehicleType === type
                    ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg"
                    : "bg-[#0d1117] border-slate-800 text-slate-400 hover:border-slate-700"
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

        {/* زر البحث عن سائق */}
        <button
          onClick={() => setIsSearching(!isSearching)}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 text-base"
        >
          {isSearching ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              جاري البحث عن سائق...
            </>
          ) : (
            <>🔍 طلب المشوار (مقاوَلة)</>
          )}
        </button>
      </div>
    </div>
  );
}
