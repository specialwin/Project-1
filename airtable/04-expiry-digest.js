/**
 * StockYa · Automation: สรุปยาใกล้หมดอายุ (ทางเลือก — แบบสคริปต์)
 * ------------------------------------------------------------------
 * แนะนำให้ใช้แบบ "ไม่ต้องเขียนสคริปต์" ก่อน (ดู README หัวข้อแจ้งเตือนหมดอายุ)
 * ใช้สคริปต์นี้เมื่ออยากได้ข้อความสรุปเป็นก้อนเดียวเพื่อส่งอีเมล/LINE
 *
 * Trigger: At a scheduled time (เช่น ทุกวัน 08:00)
 *
 * Output variables (ใช้ในแอ็กชัน Send email ถัดไป):
 *   summary  →  ข้อความสรุป
 *   count    →  จำนวนล็อตที่เข้าเงื่อนไข
 *
 * ปรับ WARN_DAYS ได้ตามต้องการ
 */
const WARN_DAYS = 90;

const Lots = base.getTable("Lots");
const q = await Lots.selectRecordsAsync({
  fields: ["Lot No", "Drug", "Warehouse", "Expiry Date", "Quantity"],
  sorts: [{ field: "Expiry Date", direction: "asc" }],
});

const today = new Date();
today.setHours(0, 0, 0, 0);
const daysLeft = (d) =>
  Math.round((new Date(d).getTime() - today.getTime()) / 86400000);

const rows = q.records
  .filter((r) => (r.getCellValue("Quantity") || 0) > 0)
  .map((r) => ({
    drug: (r.getCellValue("Drug") || [])[0]?.name || "",
    wh: (r.getCellValue("Warehouse") || [])[0]?.name || "",
    lotNo: r.getCellValueAsString("Lot No"),
    exp: String(r.getCellValue("Expiry Date") || "").slice(0, 10),
    qty: r.getCellValue("Quantity") || 0,
    d: r.getCellValue("Expiry Date")
      ? daysLeft(r.getCellValue("Expiry Date"))
      : 9999,
  }))
  .filter((x) => x.d <= WARN_DAYS)
  .sort((a, b) => a.d - b.d);

const lines = rows.map((x) => {
  const tag = x.d < 0 ? "หมดอายุแล้ว" : x.d <= 30 ? "ใกล้มาก" : "ใกล้";
  const dd = x.d < 0 ? `เกิน ${Math.abs(x.d)} วัน` : `อีก ${x.d} วัน`;
  return `• [${tag}] ${x.drug} · ล็อต ${x.lotNo} · ${x.wh} · EXP ${x.exp} · คงเหลือ ${x.qty} (${dd})`;
});

const summary = rows.length
  ? `พบยาใกล้/เกินหมดอายุ ${rows.length} ล็อต:\n` + lines.join("\n")
  : "ไม่มียาใกล้หมดอายุในขณะนี้";

output.set("summary", summary);
output.set("count", rows.length);
console.log(summary);
