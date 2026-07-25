import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rides } from "@/db/schema";
import { eq } from "drizzle-orm";

// ===== جلب رحلة واحدة (تستخدمها صفحة العميل للمتابعة) =====
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rideId = parseInt(id);

    const [ride] = await db
      .select()
      .from(rides)
      .where(eq(rides.id, rideId));

    if (!ride) {
      return NextResponse.json({ error: "الرحلة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json(ride, { status: 200 });
  } catch (error) {
    console.error("Error fetching ride:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الرحلة" },
      { status: 500 }
    );
  }
}

// ===== قبول الرحلة أو إنهاؤها (يستخدمها السائق) =====
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rideId = parseInt(id);
    const body = await request.json();
    const { action, driverId, driverPhone } = body;

    if (action === "accept") {
      if (!driverId || !driverPhone) {
        return NextResponse.json(
          { error: "بيانات السائق ناقصة" },
          { status: 400 }
        );
      }

      const [updatedRide] = await db
        .update(rides)
        .set({
          status: "accepted",
          driverId,
          driverPhone,
        })
        .where(eq(rides.id, rideId))
        .returning();

      if (!updatedRide) {
        return NextResponse.json({ error: "الرحلة غير موجودة" }, { status: 404 });
      }

      return NextResponse.json({ ride: updatedRide }, { status: 200 });
    }

    if (action === "complete") {
      const [updatedRide] = await db
        .update(rides)
        .set({ status: "completed" })
        .where(eq(rides.id, rideId))
        .returning();

      if (!updatedRide) {
        return NextResponse.json({ error: "الرحلة غير موجودة" }, { status: 404 });
      }

      return NextResponse.json({ ride: updatedRide }, { status: 200 });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Error updating ride:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الرحلة" },
      { status: 500 }
    );
  }
}
