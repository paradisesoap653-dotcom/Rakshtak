import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rides, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// ===== POST: إنشاء طلب رحلة جديد =====
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceType, pickupLocation, destination, userId, customerName } = body;

    // التحقق من الحقول المطلوبة
    if (!serviceType || !pickupLocation || !destination) {
      return NextResponse.json(
        { error: "بيانات ناقصة (الخدمة، نقطة الانطلاق، والوجهة مطلوبة)" },
        { status: 400 }
      );
    }

    // إدراج الرحلة في قاعدة البيانات
    const [newRide] = await db
      .insert(rides)
      .values({
        serviceType,
        pickupLocation,
        destination,
        userId: userId || null,
        customerName: customerName || null,
        status: "searching", // الحالة الافتراضية
      })
      .returning();

    return NextResponse.json({ ride: newRide }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating ride:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ الطلب" },
      { status: 500 }
    );
  }
}

// ===== GET: جلب الطلبات (مع رقم الحساب البنكي) =====
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // بناء الاستعلام الأساسي مع ربط جدول المستخدمين
    let query = db
      .select({
        id: rides.id,
        pickupLocation: rides.pickupLocation,
        destination: rides.destination,
        status: rides.status,
        customerPhone: rides.customerPhone,
        customerName: rides.customerName,
        userId: rides.userId,
        bankAccount: users.bankAccount, // جلب رقم الحساب من جدول المستخدمين
      })
      .from(rides)
      .leftJoin(users, eq(rides.userId, users.id)); // الربط بين userId و id

    // تصفية حسب الحالة إذا وُجدت
    if (status) {
      query = query.where(eq(rides.status, status));
    }

    const results = await query;
    return NextResponse.json(results);
  } catch (error) {
    console.error("❌ Error fetching rides:", error);
    return NextResponse.json(
      { error: "فشل جلب الطلبات" },
      { status: 500 }
    );
  }
}
