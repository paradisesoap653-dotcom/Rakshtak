import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // أعد ضبط مسار supabase حسب مشروعك

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ rides: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // توحيد اسم الهاتف القادم من الواجهة
    const phone = body.passengerPhone || body.passenger_phone || body.phone || "";

    const { data, error } = await supabase
      .from("rides")
      .insert([
        {
          service_type: body.serviceType || body.service_type || "raksha",
          pickup_location: body.pickupLocation || body.pickup_location,
          destination: body.destination,
          offered_price: body.offeredPrice || body.offered_price,
          passenger_phone: phone, // تأكد أن العمود في Supabase هو passenger_phone أو phone
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, ride: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { rideId, status, driverPhone } = body;

    const updateData: any = { status };
    if (driverPhone) {
      updateData.driver_phone = driverPhone;
    }

    const { data, error } = await supabase
      .from("rides")
      .update(updateData)
      .eq("id", rideId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, ride: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
