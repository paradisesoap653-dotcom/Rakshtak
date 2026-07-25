import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// ===== إرسال رمز التحقق (POST) - باستخدام الرمز الاحتياطي فقط =====
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });

    // استخدام رمز ثابت للتجربة (1234) أو توليد رمز عشوائي
    const verificationCode = "1234"; // يمكنك تغييره إلى Math.random() إذا أردت
    // حفظ الرمز مؤقتاً (استخدام global بأمان)
    (global as any).__verificationCodes = (global as any).__verificationCodes || {};
    (global as any).__verificationCodes[phone] = verificationCode;

    // هنا يمكنك إضافة منطق إرسال SMS لاحقاً
    console.log(`✅ رمز التحقق لـ ${phone} هو: ${verificationCode}`);

    return NextResponse.json({ message: "تم إرسال الرمز (في التجربة: 1234)" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل الإرسال" }, { status: 500 });
  }
}

// ===== التحقق من الرمز (PUT) =====
export async function PUT(request: NextRequest) {
  try {
    const { phone, code, name } = await request.json();
    if (!phone || !code) {
      return NextResponse.json({ error: "رقم الهاتف والرمز مطلوبان" }, { status: 400 });
    }

    const storedCode = (global as any).__verificationCodes?.[phone];
    const isValid = (code === storedCode) || (code === "1234");

    if (!isValid) {
      return NextResponse.json({ error: "الرمز غير صحيح" }, { status: 401 });
    }

    // حذف الرمز بعد الاستخدام
    if ((global as any).__verificationCodes) {
      delete (global as any).__verificationCodes[phone];
    }

    // البحث عن المستخدم أو إنشاؤه
    let user = await db.select().from(users).where(eq(users.phone, phone));
    
    if (user.length === 0) {
      const newName = name || `مسافر_${phone.slice(-4)}`;
      const [newUser] = await db.insert(users).values({
        phone,
        name: newName,
        role: "rider",
      }).returning();
      user = [newUser];
    }

    return NextResponse.json({
      userId: user[0].id,
      userName: user[0].name,
      role: user[0].role,
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل التحقق" }, { status: 500 });
  }
}
