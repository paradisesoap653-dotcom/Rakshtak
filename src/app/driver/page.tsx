'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Ride {
  id: string;
  pickup_location: string;
  destination: string;
  fare: number;
  status: string;
  created_at: string;
}

export default function DriverPage() {
  const [isDriverLoggedIn, setIsDriverLoggedIn] = useState(false);
  const [phone, setPhone] = useState('');
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [acceptedRide, setAcceptedRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. طلب إذن الإشعارات من السائق فور تسجيل دخوله
  useEffect(() => {
    if (isDriverLoggedIn && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('تم تفعيل الإشعارات بنجاح!');
        }
      });
    }
  }, [isDriverLoggedIn]);

  // 2. جلب الطلبات المتاحة والاستماع للتحديثات اللحظية (Realtime)
  useEffect(() => {
    if (!isDriverLoggedIn) return;

    fetchAvailableRides();

    // الاشتراك في التغييرات اللحظية لجدول المشاوير
    const channel = supabase
      .channel('public:rides')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rides' },
        (payload) => {
          const newRide = payload.new as Ride;
          if (newRide.status === 'pending') {
            setAvailableRides((prev) => [newRide, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDriverLoggedIn]);

  // 3. تشغيل صوت التنبيه وإظهار إشعار المنبثق عند وصول طلب جديد
  useEffect(() => {
    if (availableRides.length > 0 && isDriverLoggedIn) {
      // تشغيل نغمة تنبيه قصيرة
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});

      // إرسال إشعار على جهاز السائق
      if ('Notification' in window && Notification.permission === 'granted') {
        const latestRide = availableRides[0];
        new Notification('طلب مشوار جديد! 🛺', {
          body: `من: ${latestRide.pickup_location || 'الموقع الحالي'} - إلى: ${latestRide.destination || 'الوجهة'}`,
          icon: '/icon.png',
        });
      }
    }
  }, [availableRides.length, isDriverLoggedIn]);

  // جلب الطلبات التي تنتظر سائقاً
  const fetchAvailableRides = async () => {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAvailableRides(data);
    }
  };

  // تسجيل دخول السائق
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim()) {
      setIsDriverLoggedIn(true);
    }
  };

  // قبول المشوار
  const acceptRide = async (ride: Ride) => {
    setLoading(true);
    const { error } = await supabase
      .from('rides')
      .update({ status: 'accepted' })
      .eq('id', ride.id);

    if (!error) {
      setAcceptedRide(ride);
      setAvailableRides((prev) => prev.filter((r) => r.id !== ride.id));
    } else {
      alert('حدث خطأ أثناء قبول الطلب');
    }
    setLoading(false);
  };

  if (!isDriverLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" dir="rtl">
        <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-emerald-600">دخول السائق 🛺</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="tel"
              placeholder="أدخل رقم الهاتف"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border rounded-xl text-right outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
            >
              دخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto" dir="rtl">
      <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">لوحة السائق</h1>
        <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
          متصل 🟢
        </span>
      </header>

      {/* المشوار المقبول حالياً */}
      {acceptedRide && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl mb-6">
          <h2 className="font-bold text-emerald-800 mb-2">المشوار الحالي:</h2>
          <p className="text-sm text-gray-700">📍 **من:** {acceptedRide.pickup_location}</p>
          <p className="text-sm text-gray-700">🏁 **إلى:** {acceptedRide.destination}</p>
          <p className="text-sm text-emerald-700 font-bold mt-2">السعر: {acceptedRide.fare} ج.س</p>
          <button
            onClick={() => setAcceptedRide(null)}
            className="mt-3 w-full bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold"
          >
            إنهاء المشوار ✅
          </button>
        </div>
      )}

      {/* قائمة الطلبات المتاحة */}
      <h2 className="text-lg font-bold mb-3 text-gray-700">الطلبات المتاحة ({availableRides.length})</h2>
      
      {availableRides.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-2xl shadow-sm">
          في انتظار طلبات جديدة... ⏳
        </div>
      ) : (
        <div className="space-y-3">
          {availableRides.map((ride) => (
            <div key={ride.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">من: {ride.pickup_location}</p>
                  <p className="text-sm font-semibold text-gray-800">إلى: {ride.destination}</p>
                </div>
                <span className="text-emerald-600 font-bold">{ride.fare} ج.س</span>
              </div>
              <button
                onClick={() => acceptRide(ride)}
                disabled={loading}
                className="w-full mt-2 bg-emerald-600 text-white py-2 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                قبول المشوار 🛺
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
