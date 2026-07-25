import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rides } from "@/db/schema";
import { eq } from "drizzle-orm";

// ===== دالة إرسال الإشعار عبر Pusher =====
const sendPusherEvent = async (rideId: number, status: string) => {
  try {
    const Pusher = (await import('pusher')).default;
    const pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
    await pusher.trigger(`ride-${rideId}`, 'status-update', { status });
    console.log(`📡 إشعار فوري أُرسل للرحلة ${rideId}: ${status}`);
  } catch (e) {
    console.warn("⚠️ Pusher غير مضبوط، لن نستخدم التحديث الفوري.");
  }
};

// ===== جلب رحلة محددة (يستخدمها Polling الاحتياطي) =====
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rideId = parseInt(id);
    const [ride] = await db.select().from(rides).where(eq(rides.id, rideId));
    if (!ride) return NextResponse.json({ error: "غير موجودة" }, { status: 404 });
    return NextResponse.json(ride);
  } catch (error) {
    return NextResponse.json({ error: "فشل الجلب" }, { status: 500 });
  }
}

// ===== تحديث حالة الرحلة (مع إشعار فوري) =====
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rideId = parseInt(id);
    const body = await request.json();
    const { status, driverId, driverLat, driverLng } = body;

    if (!status) {
      return NextResponse.json({ error: "الحالة مطلوبة" }, { status: 400 });
    }

    await db
      .update(rides)
      .set({
        status,
        driverId: driverId || null,
        driverLat: driverLat || null,
        driverLng: driverLng || null,
      })
      .where(eq(rides.id, rideId));

    // 🔔 إرسال إشعار فوري للمستخدم
    await sendPusherEvent(rideId, status);

    return NextResponse.json({ message: "تم تحديث الرحلة" });
  } catch (error) {
    console.error("Error updating ride:", error);
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }
}
