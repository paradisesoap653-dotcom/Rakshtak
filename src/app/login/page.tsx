"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const requestCode = async () => {
    if (!phone) return alert("أدخل رقم الهاتف");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        setStep("code");
        alert("تم إرسال الرمز (في التجربة: 1234)");
      } else {
        alert("فشل إرسال الرمز");
      }
    } catch (error) {
      alert("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code) return alert("أدخل رمز التحقق");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      if (res.ok) {
        router.push("/");
      } else {
        alert("رمز التحقق غير صحيح");
      }
    } catch (error) {
      alert("حدث خطأ أثناء التحقق");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4" dir="rtl">
      {/* البطاقة الرئيسية الموحدة */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 space-y-6 text-center border border-gray-100">
        
        {/* العلوية / الهيدر */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-2">
            <span>Rakshtak</span>
            <span>|</span>
            <span>ركشتك</span>
            <span className="text-xl">🚗</span>
          </h1>
        </div>

        {step === "phone" ? (
          /* خطوة إدخال رقم الهاتف */
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-800">تسجيل الدخول برقم هاتفك</h2>

            <div className="text-right space-y-2">
              <label className="block text-sm text-gray-600 font-medium">رقم الهاتف</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: +249913009060"
                autoComplete="tel"
                className="w-full p-3.5 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-right font-mono text-base"
              />
            </div>

            <button
              onClick={requestCode}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
            </button>
          </div>
        ) : (
          /* خطوة إدخال رمز التحقق (OTP) */
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-800">أدخل رمز التحقق</h2>
            <p className="text-xs text-gray-500">
              تم إرسال الرمز إلى الرقم: <span className="font-mono font-bold text-gray-700">{phone}</span>
            </p>

            <div className="text-right space-y-2">
              <label className="block text-sm text-gray-600 font-medium">رمز التحقق</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: 1234"
                autoComplete="one-time-code"
                className="w-full p-3.5 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-center font-mono text-lg tracking-widest"
              />
            </div>

            <button
              onClick={verifyCode}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "جاري التحقق..." : "تأكيد وتأكيد الدخول"}
            </button>

            <button
              onClick={() => {
                setCode("");
                setStep("phone");
              }}
              className="text-xs text-gray-500 hover:underline pt-2 block mx-auto"
            >
              تغيير رقم الهاتف
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
