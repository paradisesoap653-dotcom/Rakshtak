export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, driverId } = body;
    const rideId = parseInt(params.id);

    if (!status) {
      return NextResponse.json({ error: "الحالة مطلوبة" }, { status: 400 });
    }

    await db
      .update(rides)
      .set({ status, driverId: driverId || null })
      .where(eq(rides.id, rideId));

    return NextResponse.json({ message: "تم تحديث الرحلة بنجاح" });
  } catch (error) {
    console.error("Error updating ride:", error);
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }
}
