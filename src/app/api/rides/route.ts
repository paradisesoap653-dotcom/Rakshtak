} catch (error) {
  console.error("Error creating ride:", error);
  return NextResponse.json(
    { error: "حدث خطأ أثناء حفظ الطلب، حاول مرة أخرى" },
    { status: 500 }
  );
}
