import { NextResponse } from "next/server";
import { db } from "@/db";
import { rides, users, ratings } from "@/db/schema";
import { eq, avg, count } from "drizzle-orm";

export async function GET() {
  try {
    const totalRides = await db.select({ count: count() }).from(rides);
    const totalDrivers = await db.select({ count: count() }).from(users).where(eq(users.role, "driver"));
    const avgRating = await db.select({ avg: avg(ratings.rating) }).from(ratings);
    
    return NextResponse.json({
      rides: totalRides[0]?.count || 0,
      drivers: totalDrivers[0]?.count || 0,
      avgRating: Math.round((avgRating[0]?.avg || 0) * 10) / 10,
    });
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب الإحصائيات" }, { status: 500 });
  }
}
