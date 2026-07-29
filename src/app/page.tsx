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
    // هنا يتم إرسال البيانات لـ Supabase
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-[#161b22] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        
        {/* الهيدر مع زر السائق */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛺</span>
            <div>
              <h1 className="font-bold text-lg text-white">ركشتك</h1>
              <p className="text-[10px] text-slate-400">عطبرة، السودان</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 text-amber-400 text-xs px-2.5 py-1 rounded-full border border-slate-700">
              مسافر_9060 ✋
            </span>
            <Link
              href="/driver"
              className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-bold transition flex items-center gap-1"
            >
              <span>🚖</span> السائق
            </Link>
          </div>
        </div>

        {/* الخريطة */}
        <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
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
              className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
              className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
              className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
              className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
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
              className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* وسيلة النقل */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">وسيلة النقل:</label>
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
