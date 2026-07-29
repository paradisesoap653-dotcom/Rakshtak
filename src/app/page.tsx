"use client";

import { useState } from "react";
import Link from "next/link";
import Map from "@/components/Map";

export default function HomePage() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [vehicleType, setVehicleType] = useState<"ركشة" | "توك توك" | "تاكسي">("ركشة");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-3 pt-6 flex flex-col items-center justify-start">
      
      {/* شريط علوي سريع للانتقال للسائق */}
      <div className="w-full max-w-md flex justify-between items-center mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛺</span>
          <span className="font-bold text-base text-white">ركشتك</span>
        </div>
        <Link
          href="/driver"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-full shadow-lg transition flex items-center gap-1.5"
        >
          <span>🚖</span> لوحة السائق
        </Link>
      </div>

      <div className="w-full max-w-md bg-[#161b22] border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-4">
        
        {/* الهيدر الداخلي مع معرف المستخدم */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-[10px] text-slate-400">عطبرة، السودان</span>
          <span className="bg-slate-800 text-amber-400 text-xs px-2.5 py-0.5 rounded-full border border-slate-700">
            مسافر_9060 ✋
          </span>
        </div>

        {/* الخريطة */}
        <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
          <Map pickupName={pickup || "موقعك الحالي"} />
        </div>

        {/* نموذج الطلب */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* نقطة الانطلاق */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">📍 من (نقطة الانطلاق):</label>
            <input
              type="text"
              required
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="مثال: السوق الكبير - عطبرة"
              className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* الوجهة */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">🏁 إلى (الوجهة):</label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="مثال: حي المطار / بربر"
              className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* السعر المقترح */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">🤝 السعر المقترح - مقاولة (اختياري):</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="أدخل السعر المبدئي بالجنيه"
              className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* رقم الهاتف / الواتساب */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">📞 رقم الهاتف / الواتساب:</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912345678"
              className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* رقم الحساب البنكي */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">🏛️ رقم الحساب البنكي (بنكك / تطبيقك):</label>
            <input
              type="number"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="أدخل رقم حسابك للتحويل"
              className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* وسيلة النقل */}
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

          {/* زر الطلب */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span> جاري البحث عن سائق...
              </>
            ) : (
              "اطلب الآن 🚀"
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
