"use client";
import { useState, useEffect } from "react";

interface Ride {
  id: number;
  serviceType: string;
  pickupLocation: string;
  destination: string;
  status: string;
  driverId?: string;
  createdAt: string;
}

export default function DriverPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [driverName, setDriverName] = useState("");
  const [nameEntered, setNameEntered] = useState(false);

  // ===== جلب الرحلات كل 4 ثواني =====
  const fetchRides = async () => {
    try {
      const res = await fetch("/api/rides");
      const data = await res.json();
      setRides(data.rides || []);
    } catch (error) {
      console.error("Error fetching rides:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!nameEntered) return;
    fetchRides();
    const interval = setInterval(fetchRides, 4000);
    return () => clearInterval(interval);
  }, [nameEntered]);

  // ===== قبول رحلة =====
  const acceptRide = async (rideId: number) => {
    setAcceptingId(rideId);
    try {
      const res = await fetch(`/api/rides/${rideId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: driverName }),
      });

      if (res.ok) {
        // نشيل الرحلة من القائمة فوراً بعد القبول
        setRides((prev) => prev.filter((r) => r.id !== rideId));
      } else {
        alert("حدث خطأ، ممكن تكون الرحلة اتقبلت بالفعل من سائق تاني");
        fetchRides();
      }
    } catch (error) {
      alert("فشل الاتصال بالخادم");
    } finally {
      setAcceptingId(null);
    }
  };

  // ===== شاشة إدخال اسم السائق =====
  if (!nameEntered) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 text-center">
          <h1 className="text-xl font-bold text-blue-600 mb-4">
            🚗 لوحة السائقين
          </h1>
          <input
            type="text"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="اكتب اسمك"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => driverName.trim() && setNameEntered(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            دخول
          </button>
        </div>
      </main>
    );
  }

  // ===== لوحة الرحلات =====
  return (
    <main className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-white">
            🚗 مرحباً {driverName}
          </h1>
          <button
            onClick={fetchRides}
            className="text-blue-400 text-sm underline"
          >
            تحديث
          </button>
        </div>

        {loading && (
          <p className="text-gray-400 text-center">جاري التحميل...</p>
        )}

        {!loading && rides.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-400">لا توجد طلبات حالياً</p>
          </div>
        )}

        <div className="space-y-3">
          {rides.map((ride) => (
            <div
              key={ride.id}
              className="bg-white rounded-xl p-4 shadow-md"
            >
              <div className="flex justify-between mb-2">
                <span className="text-gray-500 text-sm">من</span>
                <span className="font-semibold text-gray-900">
                  {ride.pickupLocation}
                </span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-gray-500 text-sm">إلى</span>
                <span className="font-semibold text-gray-900">
                  {ride.destination}
                </span>
              </div>
              <button
                onClick={() => acceptRide(ride.id)}
                disabled={acceptingId === ride.id}
                className={`w-full py-2 rounded-lg text-white font-semibold ${
                  acceptingId === ride.id
                    ? "bg-gray-400"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {acceptingId === ride.id ? "جاري القبول..." : "قبول الرحلة"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
