import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ركشتك - Rakshatak",
  description: "تطبيق طلب الركشات والتكسي",
  manifest: "/manifest.json",
  themeColor: "#f59e0b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ركشتك",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js');
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
