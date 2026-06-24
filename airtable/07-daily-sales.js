/**
 * StockYa · Automation: สรุปยอดขายรายวัน
 * ------------------------------------------------------------------
 * สรุปใบขาย (Orders ที่ Type = "Sale" และ Status = "Done") ของวันที่กำหนด
 * นับจำนวนบิล จำนวนหน่วยที่ขาย ยอดเงินรวม และรายการขายดี
 *
 * Trigger: At a scheduled time (เช่น ทุกวัน 20:00 สรุปยอดของวันนั้น)
 *
 * Input variables (ไม่บังคับ):
 *   dateISO  ←  วันที่ต้องการสรุป "YYYY-MM-DD" (ไม่ใส่ = วันนี้)
 *               ถ้าตั้งให้รันตอนเช้าเพื่อสรุป "เมื่อวาน" ให้ส่งวันที่เมื่อวานมา
 *
 * Output variables (ใช้ในแอ็กชัน Send email/LINE ถัดไป):
 *   summary    →  ข้อความสรุป
 *   count      →  จำนวนบิล
 *   totalQty   →  จำนวนหน่วยที่ขายรวม
 *   revenue    →  ยอดขายรวม (บาท) — 0 ถ้าไม่มีฟิลด์ราคา
 *
 * ยอดเงิน: ใช้ฟิลด์ Orders."Total" ถ้ามี; ไม่งั้นใช้ Order Items."Line Total";
 *          ถ้าไม่มีทั้งคู่ จะสรุปแค่จำนวน (revenue = 0)
 * วันที่:  ใช้ฟิลด์ Orders."Order Date" ถ้ามี; ไม่งั้นใช้ฟิลด์ "Created" (createdTime)
 *          ถ้าไม่มีทั้งคู่ จะรวมใบขายที่ Done ทั้งหมด (พร้อมหมายเหตุเตือน)
 */
await (async () => {
  const cfg =
    typeof input !== "undefined" && input.config ? input.config() : {};
  const Orders = base.getTable("Orders");
  const Transactions = base.getTable("Transactions");

  const target =
    (cfg.dateISO && String(cfg.dateISO).slice(0, 10)) ||
    new Date().toISOString().slice(0, 10);

  const ordFields = new Set(Orders.fields.map((f) => f.name));
  const dateField = ordFields.has("Order Date")
    ? "Order Date"
    : ordFields.has("Created")
      ? "Created"
      : null;
  const hasTotal = ordFields.has("Total");

  const ordersQ = await Orders.selectRecordsAsync({
    fields: [
      "Type",
      "Status",
      ...(dateField ? [dateField] : []),
      ...(hasTotal ? ["Total"] : []),
    ],
  });

  const sales = ordersQ.records.filter((o) => {
    if ((o.getCellValue("Type") || {}).name !== "Sale") return false;
    if ((o.getCellValue("Status") || {}).name !== "Done") return false;
    if (!dateField) return true; // ไม่มีฟิลด์วันที่ → รวมทั้งหมด (เตือนท้ายสรุป)
    return String(o.getCellValue(dateField) || "").slice(0, 10) === target;
  });
  const saleIds = new Set(sales.map((o) => o.id));

  // ยอดเงินรวม
  let revenue = null;
  if (hasTotal)
    revenue = sales.reduce((s, o) => s + (o.getCellValue("Total") || 0), 0);
  if (revenue === null) {
    const OrderItems = base.getTable("Order Items");
    if (OrderItems.fields.some((f) => f.name === "Line Total")) {
      const oiQ = await OrderItems.selectRecordsAsync({
        fields: ["Order", "Line Total"],
      });
      revenue = oiQ.records.reduce((s, it) => {
        const ord = (it.getCellValue("Order") || [])[0];
        return ord && saleIds.has(ord.id)
          ? s + (it.getCellValue("Line Total") || 0)
          : s;
      }, 0);
    }
  }

  // รายการที่ขายจริง จาก Transactions (ISSUE ที่ผูกกับใบขายเหล่านี้)
  const txQ = await Transactions.selectRecordsAsync({
    fields: ["Type", "Drug", "Quantity", "Order"],
  });
  const byDrug = new Map();
  let totalQty = 0;
  for (const t of txQ.records) {
    if ((t.getCellValue("Type") || {}).name !== "ISSUE") continue;
    const ord = (t.getCellValue("Order") || [])[0];
    if (!ord || !saleIds.has(ord.id)) continue;
    const drug = (t.getCellValue("Drug") || [])[0]?.name || "(ไม่ระบุยา)";
    const q = t.getCellValue("Quantity") || 0;
    totalQty += q;
    byDrug.set(drug, (byDrug.get(drug) || 0) + q);
  }
  const top = [...byDrug.entries()].sort((a, b) => b[1] - a[1]);

  const money = (n) =>
    Math.round(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  let summary;
  if (!sales.length) {
    summary = `📊 สรุปยอดขาย ${target}\nไม่มีรายการขายในวันนี้`;
  } else {
    const L = [
      `📊 สรุปยอดขาย ${target}`,
      `• จำนวนบิล: ${sales.length}`,
      `• จำนวนหน่วยที่ขาย: ${totalQty}`,
    ];
    if (revenue !== null) L.push(`• ยอดขายรวม: ${money(revenue)} บาท`);
    if (top.length) {
      L.push(`• ขายดี (ตามจำนวน):`);
      top
        .slice(0, 10)
        .forEach(([d, q], i) => L.push(`   ${i + 1}. ${d} — ${q}`));
    }
    if (!dateField)
      L.push(
        `(หมายเหตุ: ไม่พบฟิลด์ "Order Date"/"Created" จึงรวมใบขายที่ Done ทั้งหมด)`,
      );
    summary = L.join("\n");
  }

  output.set("summary", summary);
  output.set("count", sales.length);
  output.set("totalQty", totalQty);
  output.set("revenue", revenue || 0);
  console.log(summary);
})();
