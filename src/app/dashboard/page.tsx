"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MapPin, 
  Navigation, 
  Search, 
  Clock, 
  ShieldAlert, 
  User, 
  Car, 
  History,
  Home,
  Wallet
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RiderDashboardPage() {
  const router = useRouter();

  // 1. States
  const [pickupLocation, setPickupLocation] = useState("الموقع الحالي (السوق الشعبي)");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("rickshaw"); // 'rickshaw' | 'tuktuk' | 'bike'
  const [isSearching, setIsSearching] = useState(false);

  // أسعار وتفاصيل الوسائل
  const vehicleOptions = [
    {
      id: "rickshaw",
      title: "ركشة",
      time: "3-5 دقائق",
      price: "1,500 ج.س",
      numericFare: 1500,
      icon: "🛺",
      desc: "اقتصادية ومناسبة للمسافات القريبة"
    },
    {
      id: "tuktuk",
      title: "توك توك مغلق",
      time: "5-7 دقائق",
      price: "2,200 ج.س",
      numericFare: 2200,
      icon: "🛺",
      desc: "مريح للعائلات والأغراض الكبيرة"
    },
    {
      id: "bike",
      title: "موتر توصيل",
      time: "2-4 دقائق",
      price: "1,000 ج.س",
      numericFare: 1000,
      icon: "🏍️",
      desc: "الأسرع في الأزمات والزحام"
    },
  ];

  // 2. إرسال طلب الرحلة لـ Supabase
  const handleRequestRide = async () => {
    if (!destinationLocation.trim()) {
      alert("الرجاء إدخال وجهة الوصول أولاً!");
      return;
    }

    setIsSearching(true);

    const chosenVehicleObj = vehicleOptions.find((v) => v.id === selectedVehicle);

    try {
      // إدخال الطلب في قاعدة بيانات Supabase
      const { data, error } = await supabase
        .from("rides")
        .insert([
          {
            rider_name: "أحمد عبد الله",
            pickup_location: pickupLocation,
            destination_location: destinationLocation,
            vehicle_type: chosenVehicleObj?.title || selectedVehicle,
            fare: chosenVehicleObj?.numericFare || 1500,
            status: "pending",
          },
        ])
        .select();

      if (error) throw error;

      // الانتقال إلى صفحة التتبع
      router.push("/track-ride");
    } catch (err) {
      console.error("خطأ في طلب الرحلة:", err);
      alert("حدث خطأ أثناء إرسال الطلب. حاول مجدداً.");
      setIsSearching(false);
    }
  };

  return (
    <div className="relative h-screen w-full bg-[#121212] text-white flex flex-col justify-between overflow-hidden font-sans dir-rtl">
      
      {/* Top Floating Bar */}
      <div className="absolute top-4 right-4 left-4 z-20 flex justify-between items-center bg-[#1E1E1E]/90 backdrop-blur-md p-3 rounded-2xl border border-gray-800 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">
            🛺
          </div>
          <span className="font-extrabold text-amber-400 tracking-wider">ركشتك</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.push("/profile")}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-xs px-3 py-1.5 rounded-xl border border-gray-700 transition"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-amber-400">4,500 ج.س</span>
          </button>
        </div>
      </div>

      {/* Map Background Placeholder */}
      <div className="absolute inset-0 z-0 bg-[#0c1017] flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-[#1E293B_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
        <p className="text-gray-600 text-xs font-medium z-10">خريطة تفاعلية للحي والمنطقة 🗺️</p>
      </div>

      {/* Bottom Sheet Modal */}
      <div className="relative z-30 mt-auto bg-[#1E1E1E] border-t border-gray-800 rounded-t-3xl p-5 pb-20 shadow-2xl space-y-4">
        
        {/* Handle Bar */}
        <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto opacity-50 mb-1"></div>

        {/* Inputs Container */}
        <div className="space-y-2.5">
          {/* Pickup */}
          <div className="flex items-center bg-[#121212] rounded-xl px-3 py-2.5 border border-gray-800 focus-within:border-amber-500/50 transition">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ml-3 shrink-0"></div>
            <input 
              type="text" 
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="bg-transparent text-xs text-gray-200 w-full focus:outline-none"
              placeholder="مكان الانطلاق..."
            />
            <Navigation className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
          </div>

          {/* Destination */}
          <div className="flex items-center bg-[#121212] rounded-xl px-3 py-2.5 border border-gray-800 focus-within:border-amber-500 transition">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-500 ml-3 shrink-0"></div>
            <input 
              type="text" 
              value={destinationLocation}
              onChange={(e) => setDestinationLocation(e.target.value)}
              className="bg-transparent text-xs text-white w-full focus:outline-none font-medium"
              placeholder="إلى أين تريد الذهاب؟ (أدخل الوجهة)"
            />
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          </div>
        </div>

        {/* Vehicle Types Selection */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-gray-400">اختر نوع المركبة:</p>
          <div className="grid grid-cols-3 gap-2">
            {vehicleOptions.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-between text-center transition ${
                  selectedVehicle === v.id
                    ? "bg-amber-500/10 border-amber-500 text-white"
                    : "bg-[#121212] border-gray-800 text-gray-400 hover:border-gray-700"
                }`}
              >
                <span className="text-2xl mb-1">{v.icon}</span>
                <span className="text-xs font-bold text-white">{v.title}</span>
                <span className="text-[10px] text-amber-400 font-extrabold mt-1">{v.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Request Button */}
        <button
          onClick={handleRequestRide}
          disabled={isSearching}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-amber-500/10 transition active:scale-[0.98] disabled:opacity-50"
        >
          {isSearching ? "جاري البحث عن أقرب كابتن..." : "تأكيد وطلب الرحلة 🛺"}
        </button>

      </div>

      {/* 5. Bottom Navigation Bar */}
      <div className="fixed bottom-0 right-0 left-0 z-40 bg-[#1E1E1E] border-t border-gray-800 flex justify-around items-center py-2.5 px-4 shadow-2xl">
        <button 
          onClick={() => router.push("/dashboard")}
          className="flex flex-col items-center gap-1 text-amber-400"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">الرئيسية</span>
        </button>

        <button 
          onClick={() => router.push("/history")}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition"
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-medium">الرحلات</span>
        </button>

        <button 
          onClick={() => router.push("/profile")}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">حسابي</span>
        </button>
      </div>

    </div>
  );
}
