"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Ride {
  id: number;
  pickupLocation: string;
  destination: string;
  status: string;
  driverId?: string;
  customerName?: string;
}

export default function Home() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "searching" | "accepted" | "completed" | "cancelled">("idle");
  const [lastRideId, setLastRideId] = useState<number | null>(null);
  const [driverName, setDriverName] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("userName") || "مسافر";
    setUserName(name);
    const userId = localStorage.getItem("userId");
    if (!userId) router.push("/login");
  }, [router]);

  const createRide = async () => {
    if (!from || !to) return alert("يرجى ملء نقطة الانطلاق والوجهة");
    const userId = localStorage.getItem("userId");
    if (!userId) return router.push("/login");

    setLoading(true);
    setStatus("searching");

    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: "ride",
          pickupLocation: from,
          destination: to,
          userId: parseInt(userId),
          customerName: userName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastRideId(data.ride.id);
      } else {
        alert("حدث خطأ أثناء إرسال الطلب");
        setStatus("idle");
      }
    } catch (error) {
      alert("فشل الاتصال بالخادم");
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async () => {
    if (!lastRideId) return;
    if (!confirm("هل تريد إلغاء الرحلة؟")) return;
    try {
      await fetch(`/api/rides/${lastRideId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      setStatus("cancelled");
      alert("تم إلغاء الرحلة");
    } catch (error) {
      alert("فشل الإلغاء");
    }
  };

  useEffect(() => {
    if (!lastRideId || status === "cancelled") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rides/${lastRideId}`);
        const ride: Ride = await res.json();
        if (ride.status === "accepted") {
          setStatus("accepted");
          setDriverName(ride.driverId || "السائق");
          clearInterval(interval);
        } else if (ride.status === "completed") {
          setStatus("completed");
          clearInterval(interval);
        } else if (ride.status === "cancelled") {
          setStatus("cancelled");
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [lastRideId, status]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4 flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-white/50">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-indigo-600">🚗 ركشتك</h1>
          <span className="text-sm font-semibold text-gray-700">👋 {userName}</span> {/* تغيير إلى أغمق */}
        </div>

        {status === "idle" || status === "cancelled" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">📍 من (نقطة الانطلاق)</label> {/* أغمق */}
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="مثال: السوق الكبير"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none" /* أغمق */
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">🏁 إلى (الوجهة)</label> {/* أغمق */}
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="مثال: الجامعة"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none" /* أغمق */
              />
            </div>
            <button
              onClick={createRide}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition disabled:opacity-50"
            >
              {loading ? "جاري البحث..." : "🔍 بحث عن سائق"}
            </button>
            {status === "cancelled" && (
              <p className="text-center text-red-600 font-bold">❌ تم إلغاء الرحلة</p> /* أغمق */
            )}
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            {status === "searching" && (
              <>
                <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div></div>
                <p className="text-indigo-600 font-bold text-xl">⏳ جاري البحث عن سائق...</p>
                <p className="text-gray-600 text-sm">سيتم توصيلك في أقرب وقت</p> {/* أغمق */}
                <button onClick={cancelRide} className="text-red-600 underline text-sm font-bold">إلغاء الطلب</button> {/* أغمق */}
              </>
            )}
            {status === "accepted" && (
              <>
                <div className="text-green-500 text-6xl">✅</div>
                <p className="text-green-700 font-bold text-2xl">تم قبول الرحلة!</p>
                <p className="text-gray-800 text-lg font-semibold">{driverName} في طريقه إليك 🚗</p> {/* أغمق */}
                <div className="bg-gray-100 p-3 rounded-xl text-sm text-gray-700 font-semibold"> {/* أغمق */}
                  من: {from} → إلى: {to}
                </div>
                <div className="mt-4 rounded-xl overflow-hidden shadow-md border border-gray-200">
                  <iframe
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=32.0,15.0,33.0,16.0&layer=mapnik&marker=15.5,32.5`}
                    title="خريطة الرحلة"
                  ></iframe>
                  <p className="text-xs text-gray-600 p-2 bg-white">📍 {from} → 🏁 {to}</p> {/* أغمق */}
                </div>
                <button onClick={cancelRide} className="mt-2 text-red-600 underline text-sm font-bold">إلغاء الرحلة</button> {/* أغمق */}
              </>
            )}
            {status === "completed" && (
              <>
                <p className="text-gray-800 text-xl font-bold">✅ الرحلة انتهت بنجاح!</p> {/* أغمق */}
                <button onClick={() => { setStatus("idle"); setLastRideId(null); setFrom(""); setTo(""); }} className="bg-indigo-500 text-white px-6 py-2 rounded-xl">طلب رحلة جديدة</button>
              </>
            )}
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
          <a href="/driver" target="_blank" className="underline hover:text-indigo-600 font-medium">🚗 لوحة السائقين</a>
          <span className="mx-2">|</span>
          <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="text-red-500 underline font-medium">تسجيل خروج</button>
        </div>
      </div>
    </main>
  );
}
