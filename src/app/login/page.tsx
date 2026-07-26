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
  const requestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!phone || phone.trim().length < 8) {
      return alert("يرجى إدخال رقم هاتف صحيح");
    }

    setLoading(true);

    try {
      const fullPhone = phone.startsWith("+249") ? phone : `+249${phone}`;
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone: fullPhone }),
      });

      if (res.ok) {
        setCode("");
        setStep("code");
      } else {
        console.warn("فشل الإرسال الحقيقي، الانتقال للتجربة بالرمز 1234");
        setCode("");
        setStep("code");
      }
    } catch (error) {
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

    // 💡 شرط التجاوز التجريبي: قبول الرمز 1234 مباشرة
    if (code === "1234") {
      setLoading(false);
      router.push("/dashboard");
      return;
    }

    try {
      const fullPhone = phone.startsWith("+249") ? phone : `+249${phone}`;
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone: fullPhone, code }),
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
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between p-6 dir-rtl font-sans select-none">
      
      {/* الترويسة */}
      <div className="pt-8 flex flex-col items-start">
        <h1 className="text-2xl font-bold text-gray-100">
          {step === "phone" ? "أدخل رقم هاتفك للبدء" : "أدخل رمز التحقق"}
        </h1>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="my-auto w-full max-w-md mx-auto space-y-6">
        {step === "phone" ? (
          /* شاشة رقم الهاتف (استايل ترحال الداكن) */
          <form onSubmit={requestCode} className="space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="text-xs text-[#EE6C20] text-right font-semibold">
                رقم الهاتف
              </label>

              <div className="flex items-center space-x-3 space-x-reverse border-b border-[#EE6C20] pb-2">
                {/* العلم والمفتاح */}
                <div className="flex items-center bg-[#1E1E1E] px-3 py-2 rounded-xl border border-neutral-800 space-x-2 space-x-reverse">
                  <svg
                    className="w-6 h-4 rounded-sm object-cover"
                    viewBox="0 0 600 300"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="600" height="100" fill="#000000" />
                    <rect y="100" width="600" height="100" fill="#ffffff" />
                    <rect y="200" width="600" height="100" fill="#009A00" />
                    <polygon points="0,0 200,150 0,300" fill="#D21034" />
                  </svg>
                  <span className="text-white font-bold dir-ltr text-sm">+249</span>
                </div>

                {/* ادخال الرقم */}
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9114537190"
                  className="w-full bg-transparent text-white text-lg focus:outline-none placeholder-neutral-600 dir-ltr text-right font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !phone}
              className={`w-full py-3.5 rounded-2xl font-bold text-base transition-all duration-200 ${
                phone && !loading
                  ? "bg-[#EE6C20] text-white hover:bg-[#d85e19] shadow-lg shadow-orange-500/20"
                  : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              }`}
            >
              {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
            </button>
          </form>
        ) : (
          /* شاشة رمز التحقق */
          <div className="space-y-6">
            <div className="text-right space-y-1">
              <p className="text-xs text-neutral-400">تم إرسال الرمز إلى:</p>
              <p className="text-sm font-bold text-[#EE6C20] font-mono dir-ltr text-right">
                {phone.startsWith("+249") ? phone : `+249${phone}`}
              </p>
            </div>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="1234"
              maxLength={4}
              className="w-full bg-[#1E1E1E] border border-neutral-800 rounded-2xl py-4 text-center text-2xl font-mono text-white tracking-widest focus:outline-none focus:border-[#EE6C20]"
            />

            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 4}
              className={`w-full py-3.5 rounded-2xl font-bold text-base transition-all duration-200 ${
                code.length === 4 && !loading
                  ? "bg-[#EE6C20] text-white hover:bg-[#d85e19] shadow-lg shadow-orange-500/20"
                  : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              }`}
            >
              {loading ? "جاري التأكيد..." : "تأكيد وتأكيد الدخول 🚀"}
            </button>

            <button
              onClick={() => setStep("phone")}
              className="text-xs text-neutral-400 underline block mx-auto hover:text-white"
            >
              تغيير رقم الهاتف
            </button>
          </div>
        )}
      </div>

      <div className="pb-4 text-center text-xs text-neutral-600">
        🛺 Rakshtak | ركشتك
      </div>
    </div>
  );
}
