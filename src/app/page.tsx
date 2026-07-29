"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Pusher from 'pusher-js';

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
  const [bankAccount, setBankAccount] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("userName") || "مسافر";
    const account = localStorage.getItem("bankAccount") || "";
    setUserName(name);
    setBankAccount(account);
    const userId = localStorage.getItem("userId");
    if (!userId) router.push("/login");
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [router]);

  const updateBankAccount = async () => {
    const newAccount = prompt("أدخل رقم حسابك البنكي (مثال: بنكك - 123456789):", bankAccount);
    if (newAccount === null) return;
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: parseInt(userId!), bankAccount: newAccount }),
      });
      if (res.ok) {
        localStorage.setItem("bankAccount", newAccount);
        setBankAccount(newAccount);
        alert("✅ تم تحديث رقم الحساب!");
      } else {
        alert("❌ فشل التحديث");
      }
    } catch (e) {
      alert("خطأ في الاتصال");
    }
  };

  const notifyRider = (msg: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🚖 تحديث الرحلة", {
        body: msg,
        icon: "https://img.icons8.com/color/48/000000/taxi.png",
        tag: "ride-update",
        requireInteraction: true,
      });
    }
    if (navigator.vibrate) navigator.vibrate(200);
  };

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
    if (!lastRideId) return;

    let pusher: any = null;
    let channel: any = null;
    let interval: NodeJS.Timeout | null = null;

    try {
      pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });
      channel = pusher.subscribe(`ride-${lastRideId}`);
      channel.bind('status-update', (data: { status: string }) => {
        if (data.status === "accepted") {
          setStatus("accepted");
          setDriverName("السائق");
          notifyRider("✅ تم قبول رحلتك! السائق في الطريق.");
          if (interval) clearInterval(interval);
          pusher.unsubscribe(`ride-${lastRideId}`);
        } else if (data.status === "cancelled") {
          setStatus("cancelled");
          notifyRider("❌ تم إلغاء الرحلة.");
          if (interval) clearInterval(interval);
          pusher.unsubscribe(`ride-${lastRideId}`);
        } else if (data.status === "completed") {
          setStatus("completed");
          notifyRider("✅ الرحلة انتهت! قيّم السائق.");
          if (interval) clearInterval(interval);
          pusher.unsubscribe(`ride-${lastRideId}`);
        }
      });
    } catch (e) { console.warn("Pusher غير متاح"); }

    let pollCount = 0;
    interval = setInterval(async () => {
      pollCount++;
      try {
        const res = await fetch(`/api/rides/${lastRideId}`);
        const ride: Ride = await res.json();
        if (ride.status === "accepted" || ride.status === "cancelled" || ride.status === "completed") {
          setStatus(ride.status);
          setDriverName(ride.driverId || "السائق");
          if (interval) clearInterval(interval);
          if (pusher) pusher.unsubscribe(`ride-${lastRideId}`);
        }
        if (pollCount > 10) {
          if (interval) clearInterval(interval);
        }
      } catch (e) { console.error(e); }
    }, 3000);

    return () => {
      if (interval) clearInterval(interval);
      if (pusher) {
        try { pusher.unsubscribe(`ride-${lastRideId}`); } catch (e) {}
      }
    };
  }, [lastRideId]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-white/50">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-indigo-600">🚗 ركشتك</h1>
          <span className="text-sm font-semibold text-gray-700">👋 {userName}</span>
        </div>
        <div className="flex justify-between items-center mb-4 text-xs bg-gray-100 p-2 rounded-xl">
          <span className="text-gray-600">🏦 {bankAccount || "لم يضف حساباً"}</span>
          <button onClick={updateBankAccount} className="text-blue-500 underline font-bold">تعديل</button>
        </div>

        {status === "idle" || status === "cancelled" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">📍 من</label>
              <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="مثال: السوق الكبير" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">🏁 إلى</label>
              <input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="مثال: الجامعة" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <button onClick={createRide} disabled={loading} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition disabled:opacity-50">
              {loading ? "جاري البحث..." : "🔍 بحث عن سائق"}
            </button>
            {status === "cancelled" && <p className="text-center text-red-600 font-bold">❌ تم الإلغاء</p>}
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            {status === "searching" && (
              <>
                <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div></div>
                <p className="text-indigo-600 font-bold text-xl">⏳ جاري البحث...</p>
                <button onClick={cancelRide} className="text-red-600 underline text-sm font-bold">إلغاء الطلب</button>
              </>
            )}
            {status === "accepted" && (
              <>
                <div className="text-green-500 text-6xl">✅</div>
                <p className="text-green-700 font-bold text-2xl">تم القبول!</p>
                <p className="text-gray-800 text-lg font-semibold">{driverName} في طريقه إليك 🚗</p>
                <div className="bg-gray-100 p-3 rounded-xl text-sm text-gray-700 font-semibold">من: {from} → إلى: {to}</div>
                
                {/* ===== الخريطة (عادت) ===== */}
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
                  <p className="text-xs text-gray-600 p-2 bg-white">📍 {from} → 🏁 {to}</p>
                </div>

                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/track/${lastRideId}`;
                    if (navigator.share) {
                      navigator.share({ title: "تتبع رحلتي", text: "تابع موقعي لحظياً", url: shareUrl });
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                      alert("✅ تم نسخ رابط التتبع!");
                    }
                  }}
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-600 transition"
                >
                  📤 مشاركة الرحلة
                </button>
                <button onClick={cancelRide} className="mt-2 text-red-600 underline text-sm font-bold block mx-auto">إلغاء</button>
              </>
            )}
            {status === "completed" && (
              <>
                <p className="text-gray-800 text-xl font-bold">✅ الرحلة انتهت!</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button onClick={() => router.push(`/payment/${lastRideId}`)} className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-600 transition">💳 الدفع</button>
                  <button onClick={() => router.push(`/rate/${lastRideId}`)} className="bg-yellow-500 text-white px-4 py-2 rounded-xl font-bold">⭐ تقييم</button>
                  <button onClick={() => { setStatus("idle"); setLastRideId(null); setFrom(""); setTo(""); }} className="bg-indigo-500 text-white px-4 py-2 rounded-xl">طلب جديد</button>
                </div>
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
