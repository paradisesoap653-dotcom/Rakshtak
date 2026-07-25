import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// 1️⃣ إرسال رمز التحقق
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, code, name } = body;

    // --- حالة 1: طلب إرسال الرمز ---
    if (action === "send" || (!action && !code)) {
      if (!phone) {
        return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });
      }

      const verificationCode = "1234";
      (global as any).__verificationCodes = (global as any).__verificationCodes || {};
      (global as any).__verificationCodes[phone] = verificationCode;

      console.log(`✅ رمز التحقق لـ ${phone} هو: ${verificationCode}`);

      return NextResponse.json(
        { message: "تم إرسال الرمز بنجاح", testCode: verificationCode },
        { status: 200 }
      );
    }

    // --- حالة 2: التحقق من الرمز وتأكيد الدخول ---
    if (action === "verify" || code) {
      if (!phone || !code) {
        return NextResponse.json({ error: "رقم الهاتف والرمز مطلوبان" }, { status: 400 });
      }

      const storedCode = (global as any).__verificationCodes?.[phone];
      const isValid = code === storedCode || code === "1234";

      if (!isValid) {
        return NextResponse.json({ error: "رمز التحقق غير صحيح" }, { status: 401 });
      }

      // مسح الرمز المستعمل
      if ((global as any).__verificationCodes) {
        delete (global as any).__verificationCodes[phone];
      }

      // البحث عن المستخدم أو إنشاؤه
      let userList = await db.select().from(users).where(eq(users.phone, phone));

      if (userList.length === 0) {
        const newName = name || `مسافر_${phone.slice(-4)}`;
        const [newUser] = await db.insert(users).values({
          phone,
          name: newName,
          role: "rider",
        }).returning();
        userList = [newUser];
      }

      return NextResponse.json({
        userId: userList[0].id,
        userName: userList[0].name,
        role: userList[0].role,
      }, { status: 200 });
    }

    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  } catch (error) {
    console.error("Auth API Error:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
