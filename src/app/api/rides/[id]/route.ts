import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rides, users, ratings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// ===== تحديث متوسط التقييم =====
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
    return NextResponse.json({ error: "فشل الجلب" }, { status: 500 });
  }
}

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

    if (status === "completed") {
      const [ride] = await db.select().from(rides).where(eq(rides.id, rideId));
      
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

    return NextResponse.json({ message: "تم تحديث الرحلة" });
  } catch (error) {
    console.error("Error updating ride:", error);
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }
}
