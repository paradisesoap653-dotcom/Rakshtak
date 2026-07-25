import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// ===== إرسال رمز التحقق (POST) =====
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });

    // توليد رمز عشوائي (6 أرقام)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // حفظ الرمز مؤقتاً (في التطبيق الحقيقي استخدم Redis أو جدول مؤقت)
    // هنا سنستخدم متغير عام للتجربة (لكن في الحقيقة يُفضل تخزينه)
    globalThis.__verificationCodes = globalThis.__verificationCodes || {};
    globalThis.__verificationCodes[phone] = verificationCode;

    // محاولة إرسال SMS عبر Twilio
    try {
      // تأكد من تثبيت المكتبة: npm install twilio
      const twilio = require('twilio');
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

      if (accountSid && authToken && twilioPhone) {
        const client = twilio(accountSid, authToken);
        await client.messages.create({
          body: `🔐 رمز التحقق الخاص بتطبيق ركشتك هو: ${verificationCode}`,
          from: twilioPhone,
          to: phone,
        });
        console.log(`✅ SMS sent to ${phone}`);
      } else {
        console.warn("⚠️ Twilio variables missing, using fallback code 1234");
        // إذا لم توجد مفاتيح، نستخدم 1234 كرمز احتياطي
        globalThis.__verificationCodes[phone] = "1234";
      }
    } catch (twilioError) {
      console.error("Twilio error:", twilioError);
      // في حال فشل Twilio، نستخدم الرمز الثابت احتياطياً
      globalThis.__verificationCodes[phone] = "1234";
    }

    return NextResponse.json({ message: "تم إرسال الرمز" }, { status: 200 });
  } catch (error) {
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

    // التحقق من الرمز
    const storedCode = globalThis.__verificationCodes?.[phone];
    const isValid = (code === storedCode) || (code === "1234"); // 1234 احتياطي دائماً

    if (!isValid) {
      return NextResponse.json({ error: "الرمز غير صحيح" }, { status: 401 });
    }

    // حذف الرمز بعد الاستخدام
    if (globalThis.__verificationCodes) {
      delete globalThis.__verificationCodes[phone];
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
