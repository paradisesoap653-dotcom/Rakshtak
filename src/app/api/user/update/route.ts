import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    const { userId, bankAccount } = await request.json();
    if (!userId) return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });

    await db
      .update(users)
      .set({ bankAccount: bankAccount || null })
      .where(eq(users.id, userId));
      
    return NextResponse.json({ message: "تم تحديث الحساب" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }
}
