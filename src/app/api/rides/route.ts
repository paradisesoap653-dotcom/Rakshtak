import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rides } from "@/db/schema";

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
      })
      .returning();

    return NextResponse.json({ ride: newRide }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating ride:", error);
    // هنا نرسل الخطأ الحقيقي للمتصفح مؤقتاً للتصحيح
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء حفظ الطلب" },
      { status: 500 }
    );
  }
}
