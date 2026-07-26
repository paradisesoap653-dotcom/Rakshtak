"use client";

import { useState } from "react";
import { 
  MapPin, 
  Navigation, 
  Menu, 
  Clock, 
  ChevronLeft,
  ShieldAlert,
  Search
} from "lucide-react";

export default function DashboardPage() {
  const [pickup, setPickup] = useState("موقعي الحالي");
  const [destination, setDestination] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<"rickshaw" | "tuktuk" | "bike">("rickshaw");
  const [isSearching, setIsSearching] = useState(false);

  // أنواع المركبات والأسعار التقريبية (بالجنيه السوداني)
  const vehicles = [
    {
      id: "rickshaw",
      name: "ركشة",
      time: "3-5 دقائق",
      price: "1,500",
      icon: "🛺",
      desc: "اقتصادية ومناسبة للأزقة"
    },
    {
      id: "tuktuk",
      name: "توك توك مغلق",
      time: "5-7 دقائق",
      price: "2,000",
      icon: "🛺✨",
      desc: "مريح ومحمي من الغبار"
    },
    {
      id: "bike",
      name: "موتر توصيل",
      time: "2-4 دقائق",
      price: "1,000",
      icon: "🏍️",
      desc: "أسرع للطلبات والأفراد"
    },
  ];

  const handleOrder = () => {
    if (!destination) return;
    setIsSearching(true);
  };

  return (
    <div className="relative h-screen w-full bg-[#121212] text-white flex flex-col justify-between overflow-hidden font-sans dir-rtl">
      
      {/* 1. Header Navigation */}
      <div className="absolute top-4 right-4 left-4 z-20 flex justify-between items-center">
        <button className="bg-[#1E1E1E]/90 backdrop-blur-md p-3 rounded-full border border-gray-800 shadow-lg text-gray-200">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="bg-[#1E1E1E]/90 backdrop-blur-md px-4 py-2 rounded-full border border-gray-800 shadow-lg flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-semibold text-gray-200">ركشتك متوفرة بالقرب منك</span>
        </div>
      </div>

      {/* 2. Map Background Placeholder (Simulated Dark Map) */}
      <div className="absolute inset-0 z-0 bg-[#0c1017] flex items-center justify-center opacity-80">
        <div className="absolute inset-0 bg-[radial-[#1E293B_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
        
        {/* Animated Map Pins */}
        <div className="relative flex flex-col items-center">
          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center animate-ping absolute"></div>
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-black font-bold shadow-xl z-10">
            <Navigation className="w-5 h-5 fill-current" />
          </div>
          <span className="mt-2 text-xs bg-black/80 px-3 py-1 rounded-full border border-amber-500/40 text-amber-400 font-medium z-10">
            أنت هنا
          </span>
        </div>
      </div>

      {/* 3. Bottom Order Panel */}
      <div className="relative z-10 mt-auto bg-[#1E1E1E] border-t border-gray-800 rounded-t-3xl p-5 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-300">
        
        {/* Drag Indicator */}
        <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto -mt-2"></div>

        {/* Location Pickers */}
        <div className="bg-[#121212] rounded-2xl p-3 border border-gray-800 space-y-3">
          
          {/* Pickup Point */}
          <div className="flex items-center gap-3 border-b border-gray-800/80 pb-2.5">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <input 
              type="text" 
              value={pickup} 
              onChange={(e) => setPickup(e.target.value)}
              className="bg-transparent w-full text-sm font-medium text-gray-200 outline-none"
              placeholder="نقطة الانطلاق"
            />
          </div>

          {/* Destination Point */}
          <div className="flex items-center gap-3 pt-0.5">
            <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
            <input 
              type="text" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)}
              className="bg-transparent w-full text-sm font-medium text-white placeholder-gray-500 outline-none"
              placeholder="إلى أين تريد الذهاب؟"
            />
            <Search className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Vehicle Selection Cards */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 pr-1">اختر نوع المركبة:</p>
          <div className="grid grid-cols-3 gap-2">
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.id as any)}
                className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between ${
                  selectedVehicle === v.id 
                    ? "border-amber-500 bg-amber-500/10 text-white" 
                    : "border-gray-800 bg-[#121212]/60 text-gray-400 hover:border-gray-700"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl">{v.icon}</span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {v.time}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">{v.name}</h4>
                  <p className="text-xs font-extrabold text-amber-400">{v.price} <span className="text-[9px]">ج.س</span></p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleOrder}
          disabled={!destination || isSearching}
          className={`w-full py-4 rounded-2xl font-bold text-base transition duration-200 shadow-lg ${
            destination 
              ? "bg-amber-500 hover:bg-amber-600 text-black cursor-pointer" 
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isSearching ? "جاري البحث عن أقرب ركشة..." : "تأكيد طلب الرحلة"}
        </button>
      </div>

      {/* 4. Searching Overlay State */}
      {isSearching && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl">
              🛺
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">جاري البحث عن كابتن...</h3>
            <p className="text-sm text-gray-400">نقوم بإرسال طلبك لأقرب ركشة في المنطقة</p>
          </div>

          <button 
            onClick={() => setIsSearching(false)}
            className="px-6 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition"
          >
            إلغاء الطلب
          </button>
        </div>
      )}

    </div>
  );
}
