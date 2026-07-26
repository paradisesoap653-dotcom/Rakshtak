"use client";

import { useState } from "react";
import { 
  Power, 
  MapPin, 
  Navigation, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Clock,
  User
} from "lucide-react";

export default function DriverDashboardPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasIncomingRequest, setHasIncomingRequest] = useState(true);

  // بيانات طلب افتراضي معروض للكابتن
  const incomingRequest = {
    passengerName: "محمد عبد الله",
    pickup: "السوق الشعبي - بالقرب من موقف بحري",
    destination: "حي العمدة - شارة المحطة",
    distance: "3.2 كم",
    fare: "1,800",
    estimatedTime: "12 دقيقة"
  };

  return (
    <div className="relative h-screen w-full bg-[#121212] text-white flex flex-col justify-between overflow-hidden font-sans dir-rtl">
      
      {/* 1. Header: Toggle Online / Offline */}
      <div className="absolute top-4 right-4 left-4 z-20 flex justify-between items-center bg-[#1E1E1E]/90 backdrop-blur-md p-3 rounded-2xl border border-gray-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg border border-amber-500/20">
            🛺
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">الكابتن عثمان</h2>
            <p className="text-[10px] text-gray-400">ركشة - خ 2 / 4589</p>
          </div>
        </div>

        {/* Online Switch Button */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition duration-300 shadow-lg ${
            isOnline 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" 
              : "bg-red-500/20 text-red-400 border border-red-500/40"
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isOnline ? "متصل (جاهز)" : "غير متصل"}</span>
        </button>
      </div>

      {/* 2. Quick Stats Bar */}
      <div className="absolute top-24 right-4 left-4 z-10 grid grid-cols-2 gap-3">
        <div className="bg-[#1E1E1E]/80 backdrop-blur-md border border-gray-800 p-3 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">أرباح اليوم</p>
            <p className="text-base font-extrabold text-amber-400">12,500 <span className="text-[10px]">ج.س</span></p>
          </div>
        </div>

        <div className="bg-[#1E1E1E]/80 backdrop-blur-md border border-gray-800 p-3 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">الرحلات المكتملة</p>
            <p className="text-base font-extrabold text-white">8 <span className="text-[10px]">رحلات</span></p>
          </div>
        </div>
      </div>

      {/* 3. Map View Placeholder */}
      <div className="absolute inset-0 z-0 bg-[#0c1017] flex items-center justify-center opacity-70">
        <div className="absolute inset-0 bg-[radial-[#1E293B_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
        {!isOnline && (
          <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-gray-800 text-gray-400 text-sm font-medium z-10">
            قم بتفعيل الحالة لتبدأ استقبال الطلبات ⚡
          </div>
        )}
      </div>

      {/* 4. Incoming Ride Request Popup Modal */}
      {isOnline && hasIncomingRequest && (
        <div className="relative z-30 mt-auto bg-[#1E1E1E] border-t-2 border-amber-500 rounded-t-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-300">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
              <h3 className="text-sm font-bold text-amber-400">طلب رحلة جديد!</h3>
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 15 ثانية
            </span>
          </div>

          {/* Passenger Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-300 border border-gray-700">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{incomingRequest.passengerName}</h4>
                <p className="text-xs text-gray-400">{incomingRequest.distance} • {incomingRequest.estimatedTime}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-lg font-black text-amber-400">{incomingRequest.fare} <span className="text-xs">ج.س</span></p>
              <p className="text-[10px] text-emerald-400">كاش عند الوصول</p>
            </div>
          </div>

          {/* Route Details */}
          <div className="bg-[#121212] p-3 rounded-xl border border-gray-800/80 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1 shrink-0"></div>
              <p className="text-gray-300 truncate"><span className="text-gray-500">من:</span> {incomingRequest.pickup}</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-sm mt-1 shrink-0"></div>
              <p className="text-gray-300 truncate"><span className="text-gray-500">إلى:</span> {incomingRequest.destination}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setHasIncomingRequest(false)}
              className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-3.5 rounded-2xl font-bold text-sm transition"
            >
              <XCircle className="w-4 h-4" />
              رفض
            </button>

            <button
              onClick={() => alert("تم قبول الطلب! جاري التوجيه للإنطلاق...")}
              className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-black py-3.5 rounded-2xl font-bold text-sm transition shadow-lg"
            >
              <CheckCircle className="w-4 h-4" />
              قبول الرحلة
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
