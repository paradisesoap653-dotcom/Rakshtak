"use client";

import { useState } from "react";

type ServiceType = "ride" | "delivery" | null;

export default function Home() {
  const [selected, setSelected] = useState<ServiceType>(null);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-2">ركشتك</h1>
        <p className="text-gray-400 mb-10">ماذا تريد؟</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => setSelected("ride")}
            className={`w-full py-6 rounded-2xl border-2 transition flex items-center justify-center gap-3 text-xl font-semibold ${
              selected === "ride"
                ? "border-orange-500 bg-orange-500/10"
                : "border-gray-700 bg-gray-900"
            }`}
          >
            <span className="text-2xl">🚖</span>
            <span>مشوار</span>
          </button>

          <button
            onClick={() => setSelected("delivery")}
            className={`w-full py-6 rounded-2xl border-2 transition flex items-center justify-center gap-3 text-xl font-semibold ${
              selected === "delivery"
                ? "border-orange-500 bg-orange-500/10"
                : "border-gray-700 bg-gray-900"
            }`}
          >
            <span className="text-2xl">📦</span>
            <span>نقل بضاعة</span>
          </button>
        </div>

        {selected && (
          <button className="mt-10 w-full py-4 rounded-xl bg-orange-500 text-white font-bold text-lg">
            متابعة
          </button>
        )}
      </div>
    </main>
  );
}
