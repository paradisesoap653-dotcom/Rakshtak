"use client";

import { useState, useEffect } from "react";
import Map from "@/components/Map";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"passenger" | "driver">("passenger");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("raksha");
  const [pickup, setPickup] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [offeredPrice, setOfferedPrice] = useState<number>(1500);
  const [loading, setLoading] = useState<boolean>(false);

  // الرحلة النشطة والطلبات
  const [activeRide, setActiveRide] = useState<any>(null);
  const [pendingRides, setPendingRides] = useState<any[]>([]);

  // حالة التقييم
  const [showRating, setShowRating] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");

  const vehicles = [
    { id: "raksha", name: "ركشة", price: 1500, icon: "🛺" },
    { id: "tuk_tuk", name: "توك توك", price: 2500, icon: "🛺" },
    { id: "taxi", name: "تكسي", price: 3500, icon: "🚕" },
  ];

  // جلب البيانات بشكل دوري
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/rides");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.rides)) {
            setPendingRides(data.rides.filter((r: any) => r.status === "pending"));
          }
        }
      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // إنشاء طلب رحلة جديد
  const handleCreateRide = async () => {
    if (!pickup || !destination) {
      alert("الرجاء إدخال نقطة الانطلاق والوجهة");
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
          offeredPrice: offeredPrice,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveRide(data.ride);
      } else {
        alert("حدث خطأ أثناء إرسال الطلب");
      }
    } catch (error) {
      console.error("Error creating ride:", error);
    } finally {
      setLoading(false);
    }
  };

  // قبول الرحلة من قبل السائق
  const handleAcceptRide = async (rideId: string) => {
    try {
      const res = await fetch("/api/rides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId, status: "accepted" }),
      });
      if (res.ok) {
        alert("تم قبول الرحلة بنجاح!");
      }
    } catch (error) {
      console.error("Error accepting ride:", error);
    }
  };

  // إكمال الرحلة
  const handleCompleteRide = async () => {
    if (!activeRide) return;
    try {
      await fetch("/api/rides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId: activeRide.id, status: "completed" }),
      });
      setShowRating(true);
    } catch (error) {
      console.error("Error completing ride:", error);
    }
  };

  // إرسال التقييم
  const handleSubmitRating = () => {
    alert("شكراً لك! تم إرسال التقييم بنجاح.");
    setShowRating(false);
    setActiveRide(null);
    setPickup("");
    setDestination("");
  };

  return (
    <main className="min-h-screen bg-[#0a0c10] text-white flex flex-col items-center justify-start p-4 font-sans" dir="rtl">
      {/* شريط التبديل بين الراكب والسائق */}
      <div className="w-full max-w-md bg-[#12161f] p-1.5 rounded-2xl flex border border-slate-800/80 mb-6 shadow-lg">
        <button
          onClick={() => setActiveTab("passenger")}
          className={`flex-1 py-3 text-sm font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "passenger"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>🙋‍♂️</span> راكب
        </button>
        <button
          onClick={() => setActiveTab("driver")}
          className={`flex-1 py-3 text-sm font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "driver"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>🛺</span> سائق
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* ================= واجهة الراكب ================= */}
        {activeTab === "passenger" && (
          <>
            {showRating ? (
              /* شاشة التقييم */
              <div className="bg-[#12161f] border border-slate-800 p-6 rounded-3xl text-center space-y-5 shadow-2xl">
                <div className="w-16 h-16 bg-slate-800/80 rounded-full flex items-center justify-center mx-auto text-2xl border border-slate-700">
                  🏁
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">وصلت بسلامة الله!</h3>
                  <p className="text-xs text-slate-400 mt-1">كيف كانت تجربتك مع الكابتن عثمان؟</p>
                </div>

                <div className="flex justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform ${star <= rating ? "text-amber-400 scale-110" : "text-slate-600"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="اكتب ملاحظاتك أو كلمة شكر للكابتن (اختياري)..."
                  className="w-full bg-[#0a0c10] border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none h-20"
                />

                <button
                  onClick={handleSubmitRating}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
                >
                  إرسال التقييم
                </button>
              </div>
            ) : activeRide ? (
              /* شاشة متابعة الرحلة النشطة */
              <div className="bg-[#12161f] border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-amber-400 text-center">الرحلة جارية حالياً 🚀</h3>
                
                {/* الخريطة أثناء الرحلة */}
                <div className="h-44 rounded-2xl overflow-hidden border border-slate-800">
                  <Map center={[17.7022, 33.9822]} pickupName={activeRide.pickupLocation} />
                </div>

                <div className="bg-[#0a0c10] p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">من:</span>
                    <span className="font-bold text-white">{activeRide.pickupLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">إلى:</span>
                    <span className="font-bold text-white">{activeRide.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">السعر المقترح:</span>
                    <span className="font-bold text-emerald-400">{activeRide.offeredPrice} ج.س</span>
                  </div>
                </div>

                <button
                  onClick={handleCompleteRide}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
                >
                  ✅ التوصيل واكتمال الرحلة
                </button>
              </div>
            ) : (
              /* شاشة إدخال تفاصيل المشوار */
              <div className="bg-[#12161f] border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black text-white">تفاصيل المشوار 🛺</h2>
                  <p className="text-xs text-slate-400">حدد نقطة الانطلاق والوجهة ليصلك أقرب سائق</p>
                </div>

                {/* 📍 الخريطة التفاعلية */}
                <div className="h-48 rounded-2xl overflow-hidden border border-slate-800">
                  <Map center={[17.7022, 33.9822]} pickupName={pickup || "عطبرة"} />
                </div>

                {/* مدخلات الانطلاق والوجهة */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">من (نقطة الانطلاق)</label>
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="مثال: عطبرة - السوق الكبير"
                      className="w-full bg-[#0a0c10] border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">إلى (الوجهة)</label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="مثال: بربر"
                      className="w-full bg-[#0a0c10] border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* اختيار نوع المركبة */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {vehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVehicle(v.id);
                        setOfferedPrice(v.price);
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        selectedVehicle === v.id
                          ? "bg-amber-500/10 border-amber-500 text-white"
                          : "bg-[#0a0c10] border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-xl mb-1">{v.icon}</div>
                      <div className="text-xs font-bold">{v.name}</div>
                      <div className="text-[10px] text-amber-400 mt-0.5">{v.price} ج.س</div>
                    </button>
                  ))}
                </div>

                {/* زر تأكيد الطلب */}
                <button
                  onClick={handleCreateRide}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold rounded-2xl shadow-lg active:scale-95 transition-all text-sm disabled:opacity-50 mt-2"
                >
                  {loading ? "جاري الإرسال..." : "🚀 تأكيد وطلب الرحلة"}
                </button>
              </div>
            )}
          </>
        )}

        {/* ================= واجهة السائق ================= */}
        {activeTab === "driver" && (
          <div className="bg-[#12161f] border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-white">طلبات الرحلات المتاحة 🛺</h2>
              <p className="text-xs text-slate-400">اختر طلب وقبوله لبدء المشوار</p>
            </div>

            {pendingRides.length === 0 ? (
              <div className="bg-[#0a0c10] border border-slate-800/80 rounded-2xl p-8 text-center space-y-2">
                <p className="text-2xl">⏳</p>
                <p className="text-xs text-slate-400">لا توجد طلبات رحلات جديدة حالياً</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRides.map((ride) => (
                  <div key={ride.id} className="bg-[#0a0c10] border border-slate-800/80 p-4 rounded-2xl space-y-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-white">
                        <span className="text-slate-400">من:</span>
                        <span className="font-bold">{ride.pickupLocation}</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span className="text-slate-400">إلى:</span>
                        <span className="font-bold">{ride.destination}</span>
                      </div>
                      <div className="flex justify-between text-amber-400 font-bold pt-1">
                        <span>السعر المقترح:</span>
                        <span>{ride.offeredPrice} ج.س</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptRide(ride.id)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs active:scale-95 transition-all shadow-md"
                    >
                      قبول الطلب ✅
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
