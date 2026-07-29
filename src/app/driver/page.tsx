"use client";

import { useState } from "react";
import Map from "@/components/Map";

export default function DriverPage() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "myTrip">("requests");

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-[#161b22] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        
        {/* الهيدر مع حالة التوفر */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛺</span>
            <div>
              <h1 className="font-bold text-lg text-white">لوحة السائق</h1>
              <p className="text-[10px] text-slate-400">عطبرة، السودان</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsAvailable(!isAvailable)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              isAvailable
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
            }`}
          >
            {isAvailable ? "متاح للطلبات 🟢" : "غير متاح 🔴"}
          </button>
        </div>

        {/* الخريطة */}
        <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
          <Map pickupName="موقعك الحالي" />
        </div>

        {/* التبديل بين التبويبات */}
        <div className="grid grid-cols-2 gap-2 bg-[#0d1117] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("requests")}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "requests"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            الطلبات المتاحة 📥
          </button>
          <button
            onClick={() => setActiveTab("myTrip")}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "myTrip"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            المشوار الحالي 🚕
          </button>
        </div>

        {/* قائمة الطلبات المتاحة */}
        {activeTab === "requests" ? (
          <div className="space-y-3">
            <div className="bg-[#0d1117] border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  طلب ركشة
                </span>
                <span className="text-xs text-slate-400">قبل دقيقتين</span>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-slate-300">📍 <b>من:</b> السوق الكبير</p>
                <p className="text-slate-300">🏁 <b>إلى:</b> حي المطار</p>
                <p className="text-amber-400 font-bold">🤝 <b>العرض:</b> مقاولة / مفاصلة</p>
              </div>
              <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow transition mt-2">
                قبول المشوار 🤝
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#0d1117] border border-slate-800 p-6 rounded-2xl text-center space-y-2">
            <p className="text-slate-400 text-sm">لا يوجد مشوار نشط حالياً</p>
          </div>
        )}

      </div>
    </div>
  );
}
