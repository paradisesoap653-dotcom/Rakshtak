import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import twilio from "twilio";

// إعداد عميل Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

// دالة لتوحيد تنسيق رقم الهاتف بالصيغة الدولية (+249)
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, ""); // إزالة أي رموز غير أرقام
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1); // إزالة الصفر في البداية
  }
  if (!cleaned.startsWith("249")) {
    cleaned = "249" + cleaned; // إضافة المفتاح الدولي للسودان إذا لم يكن موجوداً
  }
  return "+" + cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone: rawPhone, code, name } = body;

    if (!rawPhone) {
      return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });
    }

    // توحيد صيغة الرقم
    const phone = normalizePhone(rawPhone);

    // --- 1. طلب إرسال الرمز ---
    if (action === "send" || (!action && !code)) {
      const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

      // حفظ الرمز في الذاكرة
      (global as any).__verificationCodes = (global as any).__verificationCodes || {};
      (global as any).__verificationCodes[phone] = verificationCode;

      // محاولة الإرسال عبر Twilio
      if (twilioClient && twilioPhone) {
        try {
          await twilioClient.messages.create({
            body: `رمز التحقق الخاص بك في ركشتك هو: ${verificationCode}`,
            from: twilioPhone,
            to: phone,
          });
          console.log(`📩 تم إرسال SMS بنجاح إلى ${phone}`);
        } catch (twilioErr: any) {
          console.error("❌ فشل إرسال SMS عبر Twilio:", twilioErr.message);
        }
      }

      return NextResponse.json({ message: "تم إرسال رمز التحقق بنجاح", phone }, { status: 200 });
    }

    // --- 2. التحقق من الرمز ---
    if (action === "verify" || code) {
      if (!code) {
        return NextResponse.json({ error: "الرمز مطلوب" }, { status: 400 });
      }

      const storedCode = (global as any).__verificationCodes?.[phone];
      
      // قبول الرمز المولّد أو الرمز الثابت "1234" لتسهيل التجربة
      const isValid = code === "1234" || (storedCode && code === storedCode);

      if (!isValid) {
        return NextResponse.json({ error: "رمز التحقق غير صحيح" }, { status: 401 });
      }

      // مسح الرمز بعد النجاح
      if ((global as any).__verificationCodes) {
        delete (global as any).__verificationCodes[phone];
      }

      // البحث عن المستخدم أو إنشاؤه في الداتابيز
      let userList = await db.select().from(users).where(eq(users.phone, phone));

      if (userList.length === 0) {
        const newName = name || `راكب_${phone.slice(-4)}`;
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
