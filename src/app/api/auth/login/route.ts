import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// دالة لتوحيد تنسيق رقم الهاتف دائماً للنموذج الدولي (+249)
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  if (!cleaned.startsWith("249")) {
    cleaned = "249" + cleaned;
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

    const phone = normalizePhone(rawPhone);

    // --- 1. طلب إرسال الرمز ---
    if (action === "send" || (!action && !code)) {
      const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

      // حفظ الرمز في الذاكرة بالرقم الموحد
      (global as any).__verificationCodes = (global as any).__verificationCodes || {};
      (global as any).__verificationCodes[phone] = verificationCode;

      console.log(`🔑 Verification code for ${phone} is: ${verificationCode}`);

      // إرسال SMS عبر Twilio API
      if (accountSid && authToken && twilioPhone) {
        try {
          const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

          const params = new URLSearchParams();
          params.append("To", phone);
          params.append("From", twilioPhone);
          params.append("Body", `رمز التحقق الخاص بك في ركشتك هو: ${verificationCode}`);

          await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          });
          console.log(`📩 Sent SMS to ${phone}`);
        } catch (twilioErr: any) {
          console.error("❌ Twilio Error:", twilioErr.message);
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
      
      // قبول الرمز المرسل أو الرمز الاحتياطي 1234
      const isValid = code === "1234" || (storedCode && code === storedCode);

      if (!isValid) {
        return NextResponse.json({ error: "رمز التحقق غير صحيح" }, { status: 401 });
      }

      // مسح الرمز بعد النجاح
      if ((global as any).__verificationCodes) {
        delete (global as any).__verificationCodes[phone];
      }

      // البحث عن المستخدم أو إضافته
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
