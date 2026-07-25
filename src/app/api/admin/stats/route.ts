import { NextResponse } from "next/server";
import { db } from "@/db";
import { rides, users, ratings } from "@/db/schema";
import { eq, avg, count } from "drizzle-orm";

export async function GET() {
  try {
    // حساب عدد الرحلات
    const totalRides = await db.select({ count: count() }).from(rides);
    // حساب عدد السائقين (حسب الدور)
    const totalDrivers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "driver"));
    // حساب متوسط التقييم (إذا كان هناك تقييمات)
    const avgRatingResult = await db
      .select({ avg: avg(ratings.rating) })
      .from(ratings);

    const ridesCount = Number(totalRides[0]?.count ?? 0);
    const driversCount = Number(totalDrivers[0]?.count ?? 0);
    const averageRating = Number(avgRatingResult[0]?.avg ?? 0);

    return NextResponse.json({
      rides: ridesCount,
      drivers: driversCount,
      avgRating: Math.round(averageRating * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "فشل جلب الإحصائيات" },
      { status: 500 }
    );
  }
}
