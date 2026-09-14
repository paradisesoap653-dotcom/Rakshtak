// نظام الإشعارات الحقيقية (Push Notifications) لتطبيق ركشتك — تظهر خارج التطبيق
// حتى لو المتصفح/التطبيق مقفول تماماً، بالضبط زي واتساب وفيسبوك.

import { supabase } from "@/lib/supabase";

// المفتاح العمومي (Public Key) الخاص بمشروع ركشتك — آمن تماماً في كود العميل
const VAPID_PUBLIC_KEY = "BKQ2YyiKnySu95bxtS7QTzXTpk6yH8kyVPSXpLyP3p8KsaxxDArEmc-I1QIavnAwP-9hIUKPuo_uFThgyb89mqE";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function getPushPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * يطلب إذن الإشعارات من المستخدم، ولو وافق يشترك فعلياً في Push
 * ويخزن الاشتراك في Supabase مربوطاً برقم هاتفه ودوره (سائق/راكب).
 */
export async function subscribeToPush(
  phone: string,
  role: "driver" | "rider" = "rider"
): Promise<string> {
  if (!isPushSupported()) return "unsupported (المتصفح ده مش داعم للإشعارات)";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied (رفضت إذن الإشعارات: " + permission + ")";

  try {
    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return "فشل: الاشتراك ما رجعش endpoint/keys صحيحة";
    }

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        phone_number: phone,
        role,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      return "خطأ في حفظ الاشتراك بقاعدة البيانات: " + error.message;
    }

    return "granted (تم الاشتراك بنجاح)";
  } catch (err: any) {
    return "استثناء غير متوقع: " + (err?.message || String(err));
  }
}
