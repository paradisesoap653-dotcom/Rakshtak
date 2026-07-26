import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rides } from "@/db/schema";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceType, pickupLocation, destination } = body;

    if (!serviceType || !pickupLocation || !destination) {
      return NextResponse.json(
        { error: "بيانات ناقصة" },
        { status: 400 }
      );
    }

    const [newRide] = await db
      .insert(rides)
      .values({
        serviceType,
        pickupLocation,
        destination,
        status: "searching", // تمت إضافة الحالة لتتوافق مع استعلام GET
      })
      .returning();

    return NextResponse.json({ ride: newRide }, { status: 201 });
  } catch (error) {
    console.error("Error creating ride:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ الطلب، حاول مرة أخرى" },
      { status: 500 }
    );
  }
}

// ===== جلب الرحلات المستنية سائق (للوحة السائقين) =====
export async function GET() {
  try {
    const pendingRides = await db
      .select()
      .from(rides)
      .where(eq(rides.status, "searching"))
      .orderBy(desc(rides.createdAt));

    return NextResponse.json({ rides: pendingRides }, { status: 200 });
  } catch (error) {
    console.error("Error fetching rides:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الرحلات" },
      { status: 500 }
    );
  }
}
