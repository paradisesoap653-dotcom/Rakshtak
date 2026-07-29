import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rides, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// ===== POST: إنشاء طلب جديد =====
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceType, pickupLocation, destination, userId, customerName } = body;

    if (!serviceType || !pickupLocation || !destination) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const [newRide] = await db
      .insert(rides)
      .values({
        serviceType,
        pickupLocation,
        destination,
        userId: userId || null,
        customerName: customerName || null,
      })
      .returning();

    return NextResponse.json({ ride: newRide }, { status: 201 });
  } catch (error) {
    console.error("Error creating ride:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حفظ الطلب" }, { status: 500 });
  }
}

// ===== GET: جلب الطلبات مع bankAccount =====
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = db
      .select({
        id: rides.id,
        pickupLocation: rides.pickupLocation,
        destination: rides.destination,
        status: rides.status,
        customerPhone: rides.customerPhone,
        customerName: rides.customerName,
        bankAccount: users.bankAccount, // <-- إضافة رقم الحساب
        userId: rides.userId,
      })
      .from(rides)
      .leftJoin(users, eq(rides.userId, users.id));

    if (status) {
      query = query.where(eq(rides.status, status));
    }
    const results = await query;
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching rides:", error);
    return NextResponse.json({ error: "فشل جلب الطلبات" }, { status: 500 });
  }
}
