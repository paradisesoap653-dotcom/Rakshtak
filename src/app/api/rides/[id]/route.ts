import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rides, users, ratings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// ===== دالة تحديث متوسط التقييم =====
async function updateUserAvgRating(userId: number) {
  const result = await db
    .select({ avg: sql<number>`AVG(rating)`, count: sql<number>`COUNT(*)` })
    .from(ratings)
    .where(eq(ratings.toUserId, userId));
  
  const avg = result[0]?.avg || 0;
  const count = result[0]?.count || 0;
  
  await db
    .update(users)
    .set({ avgRating: avg, totalRatings: count })
    .where(eq(users.id, userId));
}

// ===== دالة إرسال إشعار فوري عبر Pusher =====
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

// ===== GET: جلب رحلة محددة (يستخدمه Polling الاحتياطي) =====
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rideId = parseInt(id);
    const [ride] = await db.select().from(rides).where(eq(rides.id, rideId));
    if (!ride) {
      return NextResponse.json({ error: "الرحلة غير موجودة" }, { status: 404 });
    }
    return NextResponse.json(ride);
  } catch (error) {
    console.error("Error fetching ride:", error);
    return NextResponse.json({ error: "فشل الجلب" }, { status: 500 });
  }
}

// ===== PATCH: تحديث الرحلة (قبول، إلغاء، تقييم) =====
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rideId = parseInt(id);
    const body = await request.json();
    const { status, driverId, driverLat, driverLng, driverRating, riderRating, ratingComment } = body;

    if (!status) {
      return NextResponse.json({ error: "الحالة مطلوبة" }, { status: 400 });
    }

    // 1. تحديث الرحلة في قاعدة البيانات
    await db
      .update(rides)
      .set({
        status,
        driverId: driverId || null,
        driverLat: driverLat || null,
        driverLng: driverLng || null,
        driverRating: driverRating || null,
        riderRating: riderRating || null,
        ratingComment: ratingComment || null,
      })
      .where(eq(rides.id, rideId));

    // 2. إرسال إشعار فوري عبر Pusher (للتحديث الفوري في صفحة الراكب)
    await sendPusherEvent(rideId, status);

    // 3. إذا كانت الحالة "completed"، نقوم بتسجيل التقييمات
    if (status === "completed") {
      const [ride] = await db.select().from(rides).where(eq(rides.id, rideId));
      
      // تقييم السائق من الراكب
      if (driverRating && ride.userId) {
        await db.insert(ratings).values({
          rideId: ride.id,
          fromUserId: ride.userId,
          toUserId: ride.driverId ? parseInt(ride.driverId) : null,
          rating: driverRating,
          comment: ratingComment || "",
        });
        if (ride.driverId) await updateUserAvgRating(parseInt(ride.driverId));
      }
      
      // تقييم الراكب من السائق
      if (riderRating && ride.driverId) {
        await db.insert(ratings).values({
          rideId: ride.id,
          fromUserId: parseInt(ride.driverId),
          toUserId: ride.userId,
          rating: riderRating,
          comment: "",
        });
        if (ride.userId) await updateUserAvgRating(ride.userId);
      }
    }

    return NextResponse.json({ message: "تم تحديث الرحلة بنجاح" });
  } catch (error) {
    console.error("Error updating ride:", error);
    return NextResponse.json({ error: "فشل تحديث الرحلة" }, { status: 500 });
  }
}
