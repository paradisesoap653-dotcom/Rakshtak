"use client";

import { useEffect } from "react";

// حدود خطأ عامة لكل التطبيق: تعرض تفاصيل الخطأ الحقيقية بدل الشاشة البيضاء العامة
export default function GlobalPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App crashed:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#082f49] via-[#0c4a6e] to-[#0369a1] text-slate-100 p-4 flex flex-col items-center justify-center gap-4">
      <div className="w-full max-w-xl bg-[#0c4a6e] border border-red-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
        <div className="text-center space-y-2">
          <span className="text-4xl inline-block">⚠️</span>
          <h2 className="text-lg font-bold text-red-400">حصل خطأ في التطبيق</h2>
          <p className="text-xs text-slate-300">
            انسخ النص الأحمر بالأسفل وابعته في المحادثة عشان نصلحه فوراً
          </p>
        </div>

        <div
          dir="ltr"
          className="bg-red-950/60 border border-red-500/30 rounded-xl p-3 text-red-300 text-xs font-mono whitespace-pre-wrap break-words max-h-64 overflow-y-auto"
        >
          {error?.message || "خطأ غير معروف (بدون رسالة)"}
          {error?.digest ? `\n\ndigest: ${error.digest}` : ""}
          {error?.stack ? `\n\n${error.stack}` : ""}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => reset()}
            className="py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition"
          >
            إعادة المحاولة 🔄
          </button>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="py-3 bg-[#075985] hover:bg-[#0284c7] text-slate-200 font-extrabold text-xs rounded-xl border border-sky-700/60 transition"
          >
            الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
