
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Ride {
  id: number;
  pickupLocation: string;
  destination: string;
  status: string;
  createdAt: string;
  customerName?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRides: 0,
    totalDrivers: 0,
    totalRiders: 0,
    averageRating: 0,
    activeRides: 0,
    cancelledRides: 0,
    recentRides: [] as Ride[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/login");
      return;
    }
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">⏳ جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">📊 لوحة تحكم المشرف</h1>
        <p className="text-gray-400 mb-8">نظرة عامة على أداء التطبيق</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-600 p-6 rounded-2xl shadow-xl">
            <p className="text-3xl font-bold">{stats.totalRides}</p>
            <p className="text-sm opacity-80">🚗 إجمالي الرحلات</p>
          </div>
          <div className="bg-green-600 p-6 rounded-2xl shadow-xl">
            <p className="text-3xl font-bold">{stats.totalDrivers}</p>
            <p className="text-sm opacity-80">👨‍✈️ السائقين</p>
          </div>
          <div className="bg-purple-600 p-6 rounded-2xl shadow-xl">
            <p className="text-3xl font-bold">{stats.totalRiders}</p>
            <p className="text-sm opacity-80">🧑‍💼 الركاب</p>
          </div>
          <div className="bg-yellow-600 p-6 rounded-2xl shadow-xl">
            <p className="text-3xl font-bold">{stats.averageRating} ⭐</p>
            <p className="text-sm opacity-80">متوسط التقييم</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-indigo-600 p-4 rounded-xl">
            <p className="text-2xl font-bold">{stats.activeRides}</p>
            <p className="text-sm opacity-80">🟢 رحلات نشطة (بحث)</p>
          </div>
          <div className="bg-red-600 p-4 rounded-xl">
            <p className="text-2xl font-bold">{stats.cancelledRides}</p>
            <p className="text-sm opacity-80">🔴 رحلات ملغاة</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">🕒 آخر الرحلات</h2>
        <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-700 text-gray-300">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">من</th>
                  <th className="px-4 py-3">إلى</th>
                  <th className="px-4 py-3">الراكب</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRides.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-400">
                      لا توجد رحلات مسجلة بعد
                    </td>
                  </tr>
                ) : (
                  stats.recentRides.map((ride) => (
                    <tr key={ride.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="px-4 py-3">{ride.id}</td>
                      <td className="px-4 py-3">{ride.pickupLocation}</td>
                      <td className="px-4 py-3">{ride.destination}</td>
                      <td className="px-4 py-3">{ride.customerName || "مسافر"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          ride.status === "accepted" ? "bg-green-500/20 text-green-400" :
                          ride.status === "searching" ? "bg-yellow-500/20 text-yellow-400" :
                          ride.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                          ride.status === "completed" ? "bg-blue-500/20 text-blue-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {ride.status === "accepted" ? "✅ مقبولة" :
                           ride.status === "searching" ? "⏳ جاري البحث" :
                           ride.status === "cancelled" ? "❌ ملغاة" :
                           ride.status === "completed" ? "✔️ منتهية" :
                           ride.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(ride.createdAt).toLocaleString("ar-EG")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <a href="/" className="underline hover:text-gray-300">العودة للرئيسية</a>
          <span className="mx-2">|</span>
          <button onClick={() => { localStorage.clear(); window.location.href = "/login"; }} className="text-red-400 underline">تسجيل خروج</button>
        </div>
      </div>
    </div>
  );
}
