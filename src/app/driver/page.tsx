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
  const prevRidesCount = useRef<number>(0);

  // ===== صوت التنبيه (الميزة رقم 2) =====
  const playSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // إذا لم يدعم المتصفح، نتجاهل
    }
  };

  const fetchRides = async () => {
    try {
      const res = await fetch("/api/rides?status=searching");
      const data = await res.json();
      if (Array.isArray(data)) {
        // إذا زاد عدد الطلبات، شغل الصوت
        if (data.length > prevRidesCount.current) {
          playSound();
        }
        prevRidesCount.current = data.length;
        setRides(data);
      }
    } catch (error) {
      console.error("Error fetching rides:", error);
    }
  };

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">🚗 لوحة السائقين</h1>
          <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm">
            {rides.length} طلب جديد
          </span>
        </div>

        {rides.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/10">
            <p className="text-gray-300 text-xl">😴 لا توجد طلبات بحث حالياً</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rides.map((ride) => (
              <div key={ride.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/20 transition">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"># {ride.id}</span>
                  <span className="text-yellow-400 text-sm">⏳ بانتظار السائق</span>
                </div>
                <p className="text-white font-semibold text-lg">📍 {ride.pickupLocation}</p>
                <p className="text-gray-300 text-lg mb-2">🏁 {ride.destination}</p>
                <p className="text-gray-400 text-sm">👤 {ride.customerName || "مسافر"}</p>
                <p className="text-gray-400 text-sm mb-4">📞 {ride.customerPhone || "غير متوفر"}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRide(ride.id)}
                    className="flex-1 bg-green-500 text-white py-2 rounded-xl font-bold hover:bg-green-600 transition"
                  >
                    قبول ✅
                  </button>
                  <button
                    onClick={() => cancelRide(ride.id)}
                    className="flex-1 bg-red-500/50 text-white py-2 rounded-xl font-bold hover:bg-red-600 transition"
                  >
                    إلغاء ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <button onClick={() => { localStorage.clear(); window.location.href = "/login"; }} className="text-red-400 underline">تسجيل خروج</button>
        </div>
      </div>
    </div>
  );
}
