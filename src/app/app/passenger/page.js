"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function PassengerView() {
  const [currentRide, setCurrentRide] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    if (!currentRide?.id) return;

    // الاشتراك في التغييرات اللحظية للرحلة الحالية
    const rideChannel = supabase
      .channel(`ride-${currentRide.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${currentRide.id}`,
        },
        (payload) => {
          // إذا تغيرت حالة الرحلة إلى مكتملة
          if (payload.new.status === 'completed') {
            setShowRatingModal(true); // فتح نافذة التقييم
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rideChannel);
    };
  }, [currentRide?.id]);

  // دالة إرسال التقييم وإنهاء الرحلة تماماً للراكب
  const handleSubmitRating = async () => {
    if (currentRide?.id) {
      await supabase
        .from('rides')
        .update({ rating: rating })
        .eq('id', currentRide.id);
    }
    
    // إغلاق التقييم وتصفير الواجهة للبدء من جديد
    setShowRatingModal(false);
    setCurrentRide(null);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 dir-rtl">
      {/* محتوى واجهة الراكب الرئيسي */}
      <div className="max-w-sm mx-auto space-y-4">
        <h2 className="text-lg font-bold text-amber-400 text-center">واجهة الراكب 🛺</h2>
        
        {currentRide ? (
          <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-neutral-800 text-center space-y-2">
            <p className="text-sm font-bold text-emerald-400">الرحلة جارية...</p>
            <p className="text-xs text-neutral-400">الوجهة: {currentRide.destination}</p>
          </div>
        ) : (
          <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-neutral-800 text-center text-xs text-neutral-400">
            لا توجد رحلات نشطة حالياً.
          </div>
        )}
      </div>

      {/* نافذة التقييم Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1E1E] rounded-2xl p-6 w-full max-w-sm text-center border border-neutral-700 space-y-4">
            <h3 className="text-xl font-bold text-white">وصلت بالسلامة! 🎉</h3>
            <p className="text-neutral-300 text-sm">كيف كانت تجربة الرحلة مع الكابتن؟</p>
            
            {/* اختيار النجوم */}
            <div className="flex justify-center gap-2 text-2xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={star <= rating ? "text-amber-400" : "text-neutral-600"}
                >
                  ★
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSubmitRating}
              className="w-full bg-[#EE6C20] hover:bg-[#d85e19] text-white font-bold py-3 rounded-xl transition-all"
            >
              إرسال التقييم وطلب رحلة جديدة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
