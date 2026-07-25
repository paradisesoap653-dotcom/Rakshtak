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
  const [driverPhone, setDriverPhone] = useState("");
  const [nameEntered, setNameEntered] = useState(false);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [completing, setCompleting] = useState(false);

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
    if (!nameEntered || activeRide) return;
    fetchRides();
    const interval = setInterval(fetchRides, 4000);
    return () => clearInterval(interval);
  }, [nameEntered, activeRide]);

  // ===== قبول رحلة =====
  const acceptRide = async (ride: Ride) => {
    setAcceptingId(ride.id);
    try {
      const res = await fetch(`/api/rides/${ride.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          driverId: driverName,
          driverPhone: driverPhone,
        }),
      });

      if (res.ok) {
        setActiveRide(ride);
        setRides((prev) => prev.filter((r) => r.id !== ride.id));
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

  // ===== إنهاء الرحلة الحالية =====
  const completeRide = async () => {
    if (!activeRide) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/rides/${activeRide.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });

      if (res.ok) {
        setActiveRide(null);
      } else {
        alert("حدث خطأ أثناء إنهاء الرحلة");
      }
    } catch (error) {
      alert("فشل الاتصال بالخادم");
    } finally {
      setCompleting(false);
    }
  };

  // ===== شاشة إدخال بيانات السائق =====
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
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="tel"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
            placeholder="رقم تليفونك"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() =>
              driverName.trim() && driverPhone.trim() && setNameEntered(true)
            }
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            دخول
          </button>
        </div>
      </main>
    );
  }

  // ===== شاشة الرحلة النشطة (بعد القبول) =====
  if (activeRide) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 text-center">
          <div className="text-4xl mb-3">🚗</div
