/**
 * أدوات تنسيق والتحقق من رقم الهاتف السوداني.
 *
 * الأرقام السودانية الصحيحة: 9 أرقام تبدأ بـ 9 (موبايل: زين/MTN/سوداني)
 * أو تبدأ بـ 1 (خطوط أرضية: سوداني/Sudatel الثابتة).
 * أمثلة صحيحة:
 *   0912345678 | 912345678 (موبايل يبدأ بـ 9)
 *   0114537190 | 114537190 (أرقام سوداني/Sudatel الثابتة التي تبدأ بـ 1)
 */

/** يزيل أي بادئة دولية (00249 / +249 / 249) أو صفر محلي بشكل متكرر حتى لو تكررت
 * بالخطأ أكثر من مرة (مثال: 249249114537190) ثم يتحقق من الصيغة النهائية */
export function normalizeSudanesePhone(raw: string): string | null {
  let digits = (raw || "").replace(/\D/g, "");

  // نشيل أي بادئات زايدة بشكل متكرر لحد ما نوصل لرقم من 9 خانات
  while (digits.length > 9) {
    if (digits.startsWith("00249")) digits = digits.slice(5);
    else if (digits.startsWith("249")) digits = digits.slice(3);
    else if (digits.startsWith("0")) digits = digits.slice(1);
    else break;
  }

  return /^[19]\d{8}$/.test(digits) ? `+249${digits}` : null;
}


/** تحقق بسيط بدون تطبيع (للاستخدام الفوري أثناء الكتابة) */
export function isValidSudanesePhone(raw: string): boolean {
  return normalizeSudanesePhone(raw) !== null;
}

/** يصلّح عرض رقم مخزّن مسبقاً (حتى لو فيه بادئة 249 مكررة من بيانات قديمة)،
 * ولو ما قدر يطبّعه يرجع الرقم الأصلي كما هو بدل ما يضيع البيانات */
export function displayPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  return normalizeSudanesePhone(raw) || raw;
}

/** تنسيق مبلغ بالجنيه السوداني بفواصل الآلاف */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}
