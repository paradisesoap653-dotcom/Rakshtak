import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rides } from "@/db/schema";
import { eq } from "drizzle-orm";

// ===== جلب رحلة محددة (يستخدمها Polling في صفحة الراكب) =====
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rideId = parseInt(params.id);
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

// ===== تحديث حالة الرحلة (قبول، إلغاء، إكمال) =====
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, driverId } = body;
    const rideId = parseInt(params.id);

    if (!status) {
      return NextResponse.json({ error: "الحالة مطلوبة" }, { status: 400 });
    }

    await db
      .update(rides)
      .set({ status, driverId: driverId || null })
      .where(eq(rides.id, rideId));

    return NextResponse.json({ message: "تم تحديث الرحلة بنجاح" });
  } catch (error) {
    console.error("Error updating ride:", error);
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }
}
