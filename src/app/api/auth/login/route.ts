import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// ===== إرسال رمز التحقق =====
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });
    return NextResponse.json({ message: "تم إرسال الرمز (في التجربة: 1234)" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "فشل الإرسال" }, { status: 500 });
  }
}

// ===== التحقق من الرمز وإنشاء المستخدم (مع bankAccount) =====
export async function PUT(request: NextRequest) {
  try {
    const { phone, code, name, bankAccount } = await request.json();
    if (!phone || !code) {
      return NextResponse.json({ error: "رقم الهاتف والرمز مطلوبان" }, { status: 400 });
    }

    // رمز ثابت للتجربة
    if (code !== "1234") {
      return NextResponse.json({ error: "الرمز غير صحيح" }, { status: 401 });
    }

    let user = await db.select().from(users).where(eq(users.phone, phone));
    
    if (user.length === 0) {
      const newName = name || `مسافر_${phone.slice(-4)}`;
      const [newUser] = await db.insert(users).values({
        phone,
        name: newName,
        role: "rider",
        bankAccount: bankAccount || null,
      }).returning();
      user = [newUser];
    }

    return NextResponse.json({
      userId: user[0].id,
      userName: user[0].name,
      role: user[0].role,
      bankAccount: user[0].bankAccount || "",
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل التحقق" }, { status: 500 });
  }
}
