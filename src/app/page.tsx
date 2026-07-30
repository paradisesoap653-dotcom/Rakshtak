"use client";

import { useState } from "react";
import Link from "next/link";
import Map from "@/components/Map";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [price, setPrice] = useState("");
  const [localPhone, setLocalPhone] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [vehicleType, setVehicleType] = useState<"ركشة" | "توك توك" | "تاكسي">("ركشة");
  const [isLoading, setIsLoading] = useState(false);
  const [tripStatus, setTripStatus] = useState<string | null>(null);

  // دالة التعامل مع إدخال الهاتف وضمان المفتاح +249
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ""); // أرقام فقط
    if (val.startsWith("0")) val = val.slice(1);  // إزالة الصفر الأول إن وجد
    if (val.length <= 9) setLocalPhone(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (localPhone.length < 9) {
      alert("الرجاء إدخال رقم هاتف سوداني صحيح يتكون من 9 أرقام (مثال: 912345678)");
      return;
    }

    setIsLoading(true);
    const fullPhone = `+249${localPhone}`;

    try {
      const { data, error } = await supabase
        .from("rides")
        .insert([
          {
            passenger_name: "مسافر_9060",
            phone_number: fullPhone,
            bank_account: bankAccount,
            pickup_location: pickup,
            destination: destination,
            offered_price: price ? parseFloat(price) : null,
            service_type: vehicleType,
            status: "pending",
          },
        ])
        .select();

      if (error) {
        alert("خطأ أثناء إرسال الطلب: " + error.message);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const tripId = data[0].id;
        setTripStatus("تم إرسال الطلب بنجاح! بانتظار موافقة السائق ⏳");

        // الاستماع المباشر للتغييرات
        supabase
          .channel(`trip-${tripId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "rides",
              filter: `id=eq.${tripId}`,
            },
            (payload) => {
              if (payload.new.status === "accepted") {
                setTripStatus("تم قبول مشوارك من قبل السائق! 🛺🎉");
              } else if (payload.new.status === "completed") {
                setTripStatus("تم إنهاء المشوار بنجاح.. نتمنى لك رحلة سعيدة! 🎉");
                setTimeout(() => {
                  setTripStatus(null);
                  setIsLoading(false);
                }, 4000);
              }
            }
          )
          .subscribe();
      }
    } catch (err: any) {
      alert("حدث خطأ غير متوقع: " + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-3 pt-4 flex flex-col items-center justify-start">
      
      {/* شريط أعلى بارز يحتوي على لوحة السائق */}
      <div className="w-full max-w-md flex justify-between items-center mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛺</span>
          <span className="font-bold text-base text-white">ركشتك</span>
        </div>
        <Link
          href="/driver"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-full shadow-lg transition flex items-center gap-1.5"
        >
          <span>🚖</span> لوحة السائق
        </Link>
      </div>

      <div className="w-full max-w-md bg-[#161b22] border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-[10px] text-slate-400">عطبرة، السودان</span>
          <span className="bg-slate-800 text-amber-400 text-xs px-2.5 py-0.5 rounded-full border border-slate-700">
            مسافر_9060 ✋
          </span>
        </div>

        <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
          <Map pickupName={pickup || "موقعك الحالي"} />
        </div>

        {tripStatus ? (
          <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-3">
            <p className="text-amber-400 font-bold text-sm">{tripStatus}</p>
            <button
              onClick={() => {
                setTripStatus(null);
                setIsLoading(false);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-xl transition"
            >
              طلب جديد / إلغاء
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
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

            {/* رقم الهاتف بمفتاح السودان الثابت */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">📞 رقم الهاتف / الواتساب:</label>
              <div className="flex dir-ltr border border-slate-800 rounded-xl overflow-hidden bg-[#0d1117] focus-within:border-amber-500">
                <span className="bg-slate-800 text-amber-400 px-3 py-2 text-xs font-mono flex items-center border-r border-slate-700 font-bold">
                  🇸🇩 +249
                </span>
                <input
                  type="tel"
                  required
                  value={localPhone}
                  onChange={handlePhoneChange}
                  placeholder="912345678"
                  className="w-full bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                />
              </div>
            </div>

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
                "طلب المشوار (مقاولة) 🔍"
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
