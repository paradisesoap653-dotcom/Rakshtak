import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rides } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// 1. إضافة رحلة جديدة من الراكب
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
        status: "searching",
      })
      .returning();

    return NextResponse.json({ ride: newRide }, { status: 201 });
  } catch (error) {
    console.error("Error creating ride:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ الطلب" },
      { status: 500 }
    );
  }
}

// 2. جلب الرحلات المنتظرة للسائق أو جلب رحلة محددة للراكب
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rideId = searchParams.get("id");

    // للراكب: متابعة رحلة معينة عبر הـ ID
    if (rideId) {
      const singleRide = await db
        .select()
        .from(rides)
        .where(eq(rides.id, Number(rideId)))
        .limit(1);

      return NextResponse.json({ ride: singleRide[0] || null }, { status: 200 });
    }

    // للسائق: جلب جميع الرحلات التي في حالة "searching"
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

// 3. تحديث حالة الرحلة (قبول / إكمال / إلغاء)
export async function PATCH(request: NextRequest) {
  try {
    const { rideId, status } = await request.json();

    if (!rideId || !status) {
      return NextResponse.json(
        { error: "بيانات ناقصة لتحديث الرحلة" },
        { status: 400 }
      );
    }

    const [updatedRide] = await db
      .update(rides)
      .set({ status })
      .where(eq(rides.id, Number(rideId)))
      .returning();

    return NextResponse.json({ ride: updatedRide }, { status: 200 });
  } catch (error) {
    console.error("Error updating ride:", error);
    return NextResponse.json(
      { error: "فشل تحديث حالة الرحلة" },
      { status: 500 }
    );
  }
}
