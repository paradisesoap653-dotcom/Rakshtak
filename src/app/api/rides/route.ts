import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// إنشاء اتصال مباشر بالـ Client لتجنب مشاكل المتغيرات المفقودة
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 📩 1. جلب الطلبات (GET)
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ success: false, error: "Missing Supabase Credentials" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase GET Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, rides: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 🚀 2. إنشاء طلب رحلة جديد (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceType, pickupLocation, destination, offeredPrice } = body;

    if (!pickupLocation || !destination) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("rides")
      .insert([
        {
          service_type: serviceType || "raksha",
          pickup_location: pickupLocation,
          destination: destination,
          offered_price: offeredPrice || 1500,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase POST Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, ride: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 🔄 3. تحديث حالة الرحلة (PATCH)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { rideId, status } = body;

    const { data, error } = await supabase
      .from("rides")
      .update({ status })
      .eq("id", rideId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, ride: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
