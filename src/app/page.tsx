"use client";
import { useState, useEffect } from "react";

interface Ride {
  id: number;
  pickupLocation: string;
  destination: string;
  status: string;
  driverId?: string;
  customerPhone?: string;
}

export default function Home() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "searching" | "accepted" | "completed">("idle");
  const [lastRideId, setLastRideId] = useState<number | null>(null);
  const [driverName, setDriverName] = useState("");

  // ===== دالة إنشاء طلب جديد =====
  const createRide = async () => {
    if (!from || !to) {
      alert("يرجى ملء نقطة الانطلاق والوجهة");
      return;
    }

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

  // ===== دالة إلغاء البحث والرجوع لحالة idle =====
  const cancelSearch = () => {
    setStatus("idle");
    setLastRideId(null);
    setDriverName("");
  };

  // ===== Polling: التحديث التلقائي كل 3 ثواني =====
  useEffect(() => {
    if (!lastRideId) return;

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
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [lastRideId]);

  // ===== مؤقت تلقائي: لو مفيش رد خلال 30 ثانية، رجّع الحالة idle =====
  useEffect(() => {
    if (status !== "searching") return;

    const timeout = setTimeout(() => {
      setStatus("idle");
      setLastRideId(null);
      alert("لا يوجد سائق متاح حالياً، حاول مرة أخرى لاحقاً");
    }, 30000);

    return () => clearTimeout(timeout);
  }, [status]);

  // ===== واجهة المستخدم =====
  return (
    <main className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          🚗 ركشتك | Rakshtak
        </h1>

        <div className="space-y-4">
          {/* حقل "من" */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              من (نقطة الانطلاق)
            </label>
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="مثال: السوق الكبير"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={status === "searching" || status === "accepted"}
            />
          </div>

          {/* حقل "إلى" */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              إلى (الوجهة)
            </label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="مثال: الجامعة"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={status === "searching" || status === "accepted"}
            />
          </div>

          {/* زر البحث */}
          <button
            onClick={createRide}
            disabled={loading || status === "searching" || status === "accepted"}
            className={`w-full py-3 rounded-xl text-white font-semibold text-lg transition ${
              loading || status === "searching" || status === "accepted"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "جاري البحث..." : "بحث عن سائق"}
          </button>

          {/* زر إلغاء البحث - يظهر فقط أثناء البحث */}
          {status === "searching" && (
            <button
              onClick={cancelSearch}
              className="w-full py-2 rounded-xl text-red-600 font-medium border border-red-300 hover:bg-red-50 transition"
            >
              إلغاء البحث
            </button>
          )}
        </div>

        {/* ===== منطقة الحالة ===== */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center">
          {status === "idle" && (
            <p className="text-gray-500">املأ البيانات واضغط بحث</p>
          )}

          {status === "searching" && (
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-blue-600 font-medium">⏳ جاري البحث عن سائق...</p>
              <p className="text-sm text-gray-500">سيتم توصيلك في أقرب وقت</p>
            </div>
          )}

          {status === "accepted" && (
            <div className="space-y-2">
              <div className="text-green-600 text-4xl">✅</div>
              <p className="text-green-700 font-bold text-lg">تم قبول الرحلة!</p>
              <p className="text-gray-700">
                {driverName} في طريقه إليك 🚗
              </p>
              <p className="text-sm text-gray-500">من: {from} → إلى: {to}</p>
            </div>
          )}

          {status === "completed" && (
            <div className="space-y-2">
              <p className="text-gray-700">✅ الرحلة انتهت بنجاح</p>
              <button
                onClick={() => {
                  setStatus("idle");
                  setLastRideId(null);
                  setFrom("");
                  setTo("");
                  setDriverName("");
                }}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
              >
                طلب رحلة جديدة
              </button>
            </div>
          )}
        </div>

        {/* ربط للوحة السائق (للتجربة) */}
        <div className="mt-4 text-center text-xs text-gray-400">
          <a href="/driver" target="_blank" className="underline">
            🚗 لوحة السائقين (لفتحها في تبويب جديد)
          </a>
        </div>
      </div>
    </main>
  );
}
