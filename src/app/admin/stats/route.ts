import { NextResponse } from "next/server";
import { db } from "@/db";
import { rides, users, ratings } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";

export async function GET() {
  try {
    const totalRides = await db.select({ count: count() }).from(rides);
    const totalDrivers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "driver"));
    const totalRiders = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "rider"));
    const avgRatingResult = await db
      .select({ avg: sql<number>`AVG(rating)` })
      .from(ratings);
    const activeRides = await db
      .select({ count: count() })
      .from(rides)
      .where(eq(rides.status, "searching"));
    const cancelledRides = await db
      .select({ count: count() })
      .from(rides)
      .where(eq(rides.status, "cancelled"));
    const recentRides = await db
      .select()
      .from(rides)
      .orderBy(sql`created_at DESC`)
      .limit(10);

    return NextResponse.json({
      totalRides: totalRides[0]?.count || 0,
      totalDrivers: totalDrivers[0]?.count || 0,
      totalRiders: totalRiders[0]?.count || 0,
      averageRating: Math.round((avgRatingResult[0]?.avg || 0) * 10) / 10,
      activeRides: activeRides[0]?.count || 0,
      cancelledRides: cancelledRides[0]?.count || 0,
      recentRides: recentRides || [],
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "فشل جلب الإحصائيات" },
      { status: 500 }
    );
  }
}
