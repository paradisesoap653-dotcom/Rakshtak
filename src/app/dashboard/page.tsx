"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-rb"; // أو حسب مكتبة supabase المصدرة لديك

export default function DashboardPage() {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalRides: 0,
    completedRides: 0,
    pendingRides: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rides");
      if (res.ok) {
        const data = await res.json();
        const allRides = data.rides || [];
        setRides(allRides);

        // حساب الإحصائيات
        const completed = allRides.filter((r: any) => r.status === "completed").length;
        const pending = allRides.filter((r: any) => r.status === "pending").length;

        setStats({
          totalRides: allRides.length,
          completedRides: completed,
          pendingRides: pending,
        });
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات لوحة التحكم:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0c10] text-white p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* الهيدر */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-amber-400">لوحة التحكم - ركشتك 🛺</h1>
            <p className="text-xs text-slate-400 mt-1">متابعة كافة الطلبات والإحصائيات المباشرة</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="bg-slate-800 hover:bg-slate-700 text-xs px-4 py-2 rounded-xl border border-slate-700 transition-all active:scale-95"
          >
            🔄 تحديث البيانات
          </button>
        </div>

        {/* كروت الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#12161f] border border-slate-800 p-5 rounded-2xl shadow-lg">
            <p className="text-xs text-slate-400">إجمالي الطلبات</p>
            <p className="text-3xl font-black text-white mt-2">{stats.totalRides}</p>
          </div>

          <div className="bg-[#12161f] border border-slate-800 p-5 rounded-2xl shadow-lg">
            <p className="text-xs text-slate-400">الطلبات المكتملة</p>
            <p className="text-3xl font-black text-emerald-400 mt-2">{stats.completedRides}</p>
          </div>

          <div className="bg-[#12161f] border border-slate-800 p-5 rounded-2xl shadow-lg">
            <p className="text-xs text-slate-400">الطلبات قيد الانتظار</p>
            <p className="text-3xl font-black text-amber-400 mt-2">{stats.pendingRides}</p>
          </div>
        </div>

        {/* جدول أو قائمة الرحلات */}
        <div className="bg-[#12161f] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white">سجل الرحلات والأوامر</h2>

          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500 animate-pulse">
              جاري تحميل البيانات...
            </div>
          ) : rides.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              لا توجد رحلات مسجلة في النظام حتى الآن.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-2">الخدمة</th>
                    <th className="py-3 px-2">نقطة الانطلاق</th>
                    <th className="py-3 px-2">الوجهة</th>
                    <th className="py-3 px-2">السعر</th>
                    <th className="py-3 px-2">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {rides.map((ride: any) => (
                    <tr key={ride.id} className="hover:bg-slate-800/20">
                      <td className="py-3 px-2 font-bold text-amber-400">{ride.serviceType || "ركشة"}</td>
                      <td className="py-3 px-2 text-white">{ride.pickupLocation}</td>
                      <td className="py-3 px-2 text-white">{ride.destination}</td>
                      <td className="py-3 px-2 text-emerald-400 font-bold">{ride.offeredPrice} ج.س</td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            ride.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : ride.status === "accepted"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {ride.status === "completed"
                            ? "مكتملة"
                            : ride.status === "accepted"
                            ? "قيد التنفيذ"
                            : "قيد الانتظار"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
