import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// طلب إرسال الرمز (مرحلة 1)
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });
    // في التطبيق الحقيقي، هنا ترسل رسالة SMS. حالياً نكتفي بالتحقق.
    return NextResponse.json({ message: "تم إرسال الرمز" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "فشل الإرسال" }, { status: 500 });
  }
}

// التحقق من الرمز وإنشاء المستخدم (مرحلة 2)
export async function PUT(request: NextRequest) {
  try {
    const { phone, code, name } = await request.json();
    if (!phone || !code) {
      return NextResponse.json({ error: "رقم الهاتف والرمز مطلوبان" }, { status: 400 });
    }

    // ✅ الرمز الثابت للتجربة هو 1234
    if (code !== "1234") {
      return NextResponse.json({ error: "الرمز غير صحيح" }, { status: 401 });
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
