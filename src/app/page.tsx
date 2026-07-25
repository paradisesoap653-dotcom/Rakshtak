"use client";
import { useState, useEffect } from "react";

interface Ride {
  id: number;
  pickupLocation: string;
  destination: string;
  status: string;
  driverId?: string;
  driverPhone?: string;
  customerPhone?: string;
}

export default function Home() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "searching" | "accepted" | "completed">("idle");
  const [lastRideId, setLastRideId] = useState<number | null>(null);
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");

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

  const cancelSearch = () => {
    setStatus("idle");
    setLastRideId(null);
    setDriverName("");
    setDriverPhone("");
  };

  useEffect(() => {
    if (!lastRideId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rides/${lastRideId}`);
        const ride: Ride = await res.json();

        if (ride.status === "accepted") {
          setStatus("accepted");
          setDriverName(ride.driverId || "السائق");
          setDriverPhone(ride.driverPhone || "");
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

  useEffect(() => {
    if (status !== "searching") return;

    const timeout = setTimeout(() => {
      setStatus("idle");
      setLastRideId(null);
      alert("لا يوجد سائق متاح حالياً، حاول مرة أخرى لاحقاً");
    }, 30000);

    return () => clearTimeout(timeout);
  }, [status]);

  return (
    <main className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          🚗 ركشتك | Rakshtak
        </h1>

        <div className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              إلى (الوجهة)
            </label>
            <input
              type="text"
