"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState("raksha");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [activeRide, setActiveRide] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // إرسال طلب جديد
  const handleCreateRide = async () => {
    if (!pickup || !destination) {
      alert("الرجاء كتابة مكان الانطلاق والوجهة");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: selectedVehicle,
          pickupLocation: pickup,
          destination: destination,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveRide(data.ride);
        setIsSearching(true);
      } else {
        alert("حدث خطأ أثناء إرسال الطلب");
      }
    } catch (err) {
      console.error(err);
      alert("تعذر الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 الاستعلام الدوري اللحظي: يتأكد كل ثانيتين هل السائق قبل الرحلة أم لا
  useEffect(() => {
    if (!isSearching || !activeRide?.id) return;

    const checkRideStatus = async () => {
      try {
        const res = await fetch(`/api/rides?id=${activeRide.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ride) {
            setActiveRide(data.ride);
          }
        }
      } catch (err) {
        console.error("خطأ في متابعة الرحلة:", err);
      }
    };

    const interval = setInterval(checkRideStatus, 2000);
    return () => clearInterval(interval);
  }, [isSearching, activeRide?.id]);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between px-5 py-6 font-sans dir-rtl" dir="rtl">
      {/* 1. الترويسة العلوية للتحويل بين الراكب والسائق */}
      <div className="w-full max-w-md mx-auto flex justify-between items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl w-full">
          <button
            className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-orange-500 text-white shadow-md"
          >
            راكب 🙋‍♂️
          </button>
          <button
            onClick={() => router.push("/driver")}
            className="flex-1 py-2.5 rounded-lg font-bold text-sm text-slate-400 hover:text-white transition-all"
          >
            سائق 🛺
          </button>
        </div>
      </div>

      {/* 2. شاشات الحالة */}
      {isSearching ? (
        <div className="w-full max-w-md mx-auto my-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-xl">
          {activeRide?.status === "accepted" ? (
            /* عند قبول السائق للطلب */
            <>
              <div className="text-6xl animate-bounce my-2">🎉</div>
              <h2 className="text-2xl font-bold text-emerald-400">تم قبول طلبك!</h2>
              <p className="text-xs text-slate-300">الكابتن عثمان في الطريق إليك الآن 🛺</p>

              <div className="bg-slate-950 p-4 rounded-2xl text-right space-y-2 border border-emerald-500/30">
                <p className="text-sm text-slate-400">من: <span className="text-white font-semibold">{activeRide.pickupLocation}</span></p>
                <p className="text-sm text-slate-400">إلى: <span className="text-white font-semibold">{activeRide.destination}</span></p>
                <p className="text-sm text-slate-400">السعر: <span className="text-amber-400 font-bold">1,500 ج.س</span></p>
              </div>

              <a
                href="tel:0912345678"
                className="block w-full py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-sm"
              >
                📞 الاتصال بالكابتن
              </a>

              <button
                onClick={() => {
                  setIsSearching(false);
                  setActiveRide(null);
                  setPickup("");
                  setDestination("");
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                إنهاء الواجهة
              </button>
            </>
          ) : (
            /* أثناء انتظار القبول */
            <>
              <div className="text-6xl animate-pulse my-4">🛺</div>
              <h2 className="text-2xl font-bold text-orange-400">جاري البحث عن أطلب ركشة...</h2>
              
              <div className="bg-slate-950 p-4 rounded-2xl text-right space-y-2 border border-slate-800">
                <p className="text-sm text-slate-400">من: <span className="text-white font-semibold">{pickup}</span></p>
                <p className="text-sm text-slate-400">إلى: <span className="text-white font-semibold">{destination}</span></p>
              </div>

              <button
                onClick={() => {
                  setIsSearching(false);
                  setActiveRide(null);
                }}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold border border-red-500/20 transition-all"
              >
                إلغاء الرحلة
              </button>
            </>
          )}
        </div>
      ) : (
        /* 3. واجهة كتابة الطلب */
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black tracking-wide text-white">تفاصيل المشوار 🛺</h1>
            <p className="text-xs text-slate-400">حدد نقطة الانطلاق والوجهة ليصلك أقرب سائق</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mr-1 mb-1 block">من (نقطة الانطلاق)</label>
              <input
                type="text"
                placeholder="مثال: عطبرة"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm transition-all"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mr-1 mb-1 block">إلى (الوجهة)</label>
              <input
                type="text"
                placeholder="مثال: الدامر"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { id: "raksha", name: "ركشة", price: "1,500", icon: "🛺" },
              { id: "tuktuk", name: "توك توك", price: "2,500", icon: "🛺" },
              { id: "taxi", name: "تكسي", price: "3,500", icon: "🚕" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedVehicle(item.id)}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                  selectedVehicle === item.id
                    ? "border-orange-500 bg-orange-500/10 text-white"
                    : "border-slate-800 bg-slate-900/50 text-slate-400"
                }`}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="text-xs font-bold">{item.name}</span>
                <span className="text-[10px] text-orange-400 mt-1">{item.price} ج.س</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleCreateRide}
            disabled={loading}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 text-base transition-all disabled:opacity-50"
          >
            {loading ? "جاري الحفظ..." : "🚀 تأكيد وطلب الرحلة"}
          </button>
        </div>
      )}

      <div className="text-center text-[11px] text-slate-600">
        تطبيق ركشتك • جميع الحقوق محفوظة
      </div>
    </main>
  );
}
