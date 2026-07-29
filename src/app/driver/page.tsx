"use client";
import { useEffect, useState, useRef } from "react";

interface Ride {
  id: number;
  pickupLocation: string;
  destination: string;
  status: string;
  customerPhone?: string;
  customerName?: string;
}

export default function DriverDashboard() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevRidesCount = useRef<number>(0);

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const notifyDriver = (ride: Ride) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.6);
    } catch (e) {}

    if (navigator.vibrate) navigator.vibrate(300);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🚗 طلب رحلة جديد!", {
        body: `من: ${ride.pickupLocation} → إلى: ${ride.destination}`,
        icon: "https://img.icons8.com/color/48/000000/taxi.png",
        tag: "new-ride",
        requireInteraction: true,
      });
    }
  };

  const fetchRides = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rides?status=searching");
      if (!res.ok) throw new Error(`خطأ في الخادم: ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        if (data.length > prevRidesCount.current && data.length > 0) {
          notifyDriver(data[0]);
        }
        prevRidesCount.current = data.length;
        setRides(data);
      } else {
        throw new Error("البيانات غير صحيحة");
      }
    } catch (err: any) {
      setError(err.message || "فشل جلب الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    fetchRides();
    const interval = setInterval(fetchRides, 3000);
    return () => clearInterval(interval);
  }, []);

  const acceptRide = async (id: number) => {
    try {
      await fetch(`/api/rides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted", driverId: "عبدالله" }),
      });
      alert("✅ تم قبول الرحلة!");
      fetchRides();
    } catch (error) {
      alert("❌ فشل القبول");
    }
  };

  const cancelRide = async (id: number) => {
    if (!confirm("هل تريد إلغاء هذه الرحلة؟")) return;
    try {
      await fetch(`/api/rides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      alert("تم إلغاء الرحلة");
      fetchRides();
    } catch (error) {
      alert("فشل الإلغاء");
    }
  };

  const completeRide = async (id: number) => {
    const rating = prompt("قيم الراكب من 1 إلى 5 نجوم:");
    if (rating && !isNaN(Number(rating)) && Number(rating) >= 1 && Number(rating) <= 5) {
      try {
        await fetch(`/api/rides/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed", riderRating: Number(rating) }),
        });
        alert("✅ تم إنهاء الرحلة وتقييم الراكب!");
        fetchRides();
      } catch (error) {
        alert("❌ فشل إنهاء الرحلة");
      }
    } else {
      alert("يرجى إدخال تقييم بين 1 و 5");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
          <h1 className="text-3xl font-bold text-white">🚗 لوحة السائقين</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">
              {rides.length} طلب جديد
            </span>
            <button onClick={fetchRides} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-sm font-bold transition disabled:opacity-50">
              {loading ? "⏳" : "🔄 تحديث"}
            </button>
            <button onClick={() => { if ("Notification" in window) Notification.requestPermission().then(p => alert(`الإشعارات: ${p}`)); }} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold transition">
              🔔 تفعيل الإشعارات
            </button>
          </div>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-xl mb-4 text-center">⚠️ {error}</div>}

        {rides.length === 0 && !error ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/10">
            <p className="text-gray-200 text-xl font-semibold">😴 لا توجد طلبات</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rides.map((ride) => (
              <div key={ride.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/20 transition">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"># {ride.id}</span>
                  <span className="text-yellow-400 text-sm font-bold">⏳ بانتظار السائق</span>
                </div>
                <p className="text-white font-bold text-lg">📍 {ride.pickupLocation}</p>
                <p className="text-gray-300 text-lg mb-2">🏁 {ride.destination}</p>
                <p className="text-gray-300 text-sm">👤 {ride.customerName || "مسافر"}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button onClick={() => acceptRide(ride.id)} className="flex-1 bg-green-500 text-white py-2 rounded-xl font-bold hover:bg-green-600 transition">قبول ✅</button>
                  <button onClick={() => cancelRide(ride.id)} className="flex-1 bg-red-500/50 text-white py-2 rounded-xl font-bold hover:bg-red-600 transition">إلغاء ❌</button>
                  <button onClick={() => completeRide(ride.id)} className="flex-1 bg-purple-500 text-white py-2 rounded-xl font-bold hover:bg-purple-600 transition">إنهاء ✨</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <button onClick={() => { localStorage.clear(); window.location.href = "/login"; }} className="text-red-400 underline font-bold">تسجيل خروج</button>
        </div>
      </div>
    </div>
  );
            }
