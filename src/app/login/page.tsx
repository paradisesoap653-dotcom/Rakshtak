"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. طلب إرسال الرمز
  const requestCode = async () => {
    if (!phone || phone.trim().length < 8) {
      return alert("يرجى إدخال رقم هاتف صحيح");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone }),
      });

      const data = await res.json();

      if (res.ok) {
        setCode(""); // تفريغ خانة الرمز
        setStep("code");
      } else {
        // حتى لو فشل الإرسال الحقيقي عبر Twilio، ننتقل لصفحة الرمز لنسمح بالرمز التجريبي 1234
        console.warn("فشل الإرسال الحقيقي، الانتقال للتجربة بالرمز 1234");
        setCode("");
        setStep("code");
      }
    } catch (error) {
      // التجاوز في حالة وجود أي خطأ في الاتصال
      setCode("");
      setStep("code");
    } finally {
      setLoading(false);
    }
  };

  // 2. التحقق من الرمز وتأكيد الدخول
  const verifyCode = async () => {
    if (!code || code.trim().length !== 4) {
      return alert("يرجى إدخال رمز التحقق المكون من 4 أرقام");
    }

    setLoading(true);

    // 💡 شرط التجاوز التجريبي: قبول الرمز 1234 مباشرة دون الحاجة للـ API
    if (code === "1234") {
      setLoading(false);
      router.push("/dashboard"); // التوجيه إلى الشاشة الرئيسية أو اللوحة
      return;
    }

    // المنطق العادي للتحقق عبر الـ API
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone, code }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        alert(data.error || "رمز التحقق غير صحيح");
      }
    } catch (error) {
      alert("حدث خطأ أثناء التحقق، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dir-rtl">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-6">🚗 | Rakshtak | ركشتك</h1>

        {step === "phone" ? (
          /* شاشة إدخال رقم الهاتف */
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">أدخل رقم الهاتف</h2>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 249114537190+"
              className="w-full p-3 border border-gray-300 rounded-lg text-center dir-ltr focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={requestCode}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
            </button>
          </div>
        ) : (
          /* شاشة إدخال رمز التحقق */
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">أدخل رمز التحقق</h2>
            <p className="text-xs text-gray-500 dir-ltr">تم إرسال الرمز إلى الرقم: {phone}</p>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="مثال: 1234"
              maxLength={4}
              className="w-full p-3 border border-gray-300 rounded-lg text-center text-xl tracking-widest focus:outline-none focus:border-green-500"
            />

            <button
              onClick={verifyCode}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "جاري التأكيد..." : "تأكيد وتأكيد الدخول"}
            </button>

            <button
              onClick={() => setStep("phone")}
              className="text-sm text-gray-500 underline block mx-auto mt-2 hover:text-gray-700"
            >
              تغيير رقم الهاتف
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
