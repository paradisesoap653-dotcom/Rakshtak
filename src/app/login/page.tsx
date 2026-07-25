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
      alert("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code) return alert("أدخل الرمز");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userName", data.userName);
        localStorage.setItem("userRole", data.role);
        router.push("/");
      } else {
        alert(data.error || "الرمز غير صحيح");
      }
    } catch (error) {
      alert("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-2">🚗 ركشتك</h1>
        <p className="text-center text-gray-500 mb-6">سجل الدخول برقم هاتفك</p>

        {step === "phone" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 0912345678"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                dir="ltr"
              />
            </div>
            <button
              onClick={requestCode}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400"
            >
              {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رمز التحقق</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="أدخل الرمز (1234)"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                dir="ltr"
              />
              <p className="text-xs text-gray-400 mt-1">✨ للتجربة، استخدم الرمز: <strong>1234</strong></p>
            </div>
            <button
              onClick={verifyCode}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {loading ? "جاري التحقق..." : "تحقق وادخل"}
            </button>
            <button
              onClick={() => setStep("phone")}
              className="w-full text-sm text-indigo-500 underline"
            >
              تغيير رقم الهاتف
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
