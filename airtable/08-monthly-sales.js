/**
 * StockYa · Automation/Script: สรุปยอดขายรายเดือน + เทียบรายวัน
 * ------------------------------------------------------------------
 * สรุปใบขาย (Type = "Sale", Status = "Done") ทั้งเดือน พร้อมแตกยอดรายวัน
 * ให้เทียบว่าวันไหนขายดี/ขายน้อย และจัดอันดับยาขายดี
 *
 * รันได้ 2 แบบ:
 *   - Automation "Run a script" (ตั้งเวลาเช่นทุกสิ้นเดือน) → ใช้ output vars ต่อ
 *   - Scripting extension (กดรันเอง) → ดูผลใน console
 *
 * Input variables (ไม่บังคับ):
 *   monthISO  ←  เดือนที่ต้องการ "YYYY-MM" (ไม่ใส่ = เดือนปัจจุบัน)
 *
 * Output variables:
 *   summary · month · bills · totalQty · revenue · activeDays
 */
await (async () => {
  const cfg =
    typeof input !== "undefined" && input.config ? input.config() : {};
  const emit = (k, v) => {
    if (typeof output !== "undefined" && output && output.set) output.set(k, v);
  };
  const Orders = base.getTable("Orders");
  const Transactions = base.getTable("Transactions");

  const month =
    (cfg.monthISO && String(cfg.monthISO).slice(0, 7)) ||
    new Date().toISOString().slice(0, 7);

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

  // ใบขายที่ Done ในเดือนนี้ + วันที่ของแต่ละใบ
  const orderDate = new Map();
  const sales = ordersQ.records.filter((o) => {
    if ((o.getCellValue("Type") || {}).name !== "Sale") return false;
    if ((o.getCellValue("Status") || {}).name !== "Done") return false;
    const d = dateField
      ? String(o.getCellValue(dateField) || "").slice(0, 10)
      : "";
    if (dateField && d.slice(0, 7) !== month) return false;
    orderDate.set(o.id, d);
    return true;
  });
  const saleIds = new Set(sales.map((o) => o.id));

  // ยอดเงินต่อใบ
  const revByOrder = new Map();
  if (hasTotal) {
    for (const o of sales) revByOrder.set(o.id, o.getCellValue("Total") || 0);
  } else {
    const OrderItems = base.getTable("Order Items");
    if (OrderItems.fields.some((f) => f.name === "Line Total")) {
      const oiQ = await OrderItems.selectRecordsAsync({
        fields: ["Order", "Line Total"],
      });
      for (const it of oiQ.records) {
        const ord = (it.getCellValue("Order") || [])[0];
        if (ord && saleIds.has(ord.id))
          revByOrder.set(
            ord.id,
            (revByOrder.get(ord.id) || 0) + (it.getCellValue("Line Total") || 0),
          );
      }
    }
  }

  // แตกยอดรายวัน + ยาขายดี (จาก Transactions ISSUE ที่ผูกกับใบขายเหล่านี้)
  const days = new Map(); // "YYYY-MM-DD" -> {bills, qty, revenue}
  const getDay = (d) => {
    let e = days.get(d);
    if (!e) days.set(d, (e = { bills: 0, qty: 0, revenue: 0 }));
    return e;
  };
  for (const o of sales) {
    const e = getDay(orderDate.get(o.id) || "(ไม่ทราบวันที่)");
    e.bills += 1;
    e.revenue += revByOrder.get(o.id) || 0;
  }

  const txQ = await Transactions.selectRecordsAsync({
    fields: ["Type", "Drug", "Quantity", "Order"],
  });
  const byDrug = new Map();
  let totalQty = 0;
  for (const t of txQ.records) {
    if ((t.getCellValue("Type") || {}).name !== "ISSUE") continue;
    const ord = (t.getCellValue("Order") || [])[0];
    if (!ord || !saleIds.has(ord.id)) continue;
    const q = t.getCellValue("Quantity") || 0;
    totalQty += q;
    getDay(orderDate.get(ord.id) || "(ไม่ทราบวันที่)").qty += q;
    const drug = (t.getCellValue("Drug") || [])[0]?.name || "(ไม่ระบุยา)";
    byDrug.set(drug, (byDrug.get(drug) || 0) + q);
  }

  const revenue = [...revByOrder.values()].reduce((s, v) => s + v, 0);
  const dayRows = [...days.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const top = [...byDrug.entries()].sort((a, b) => b[1] - a[1]);
  const money = (n) =>
    Math.round(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  let summary;
  if (!sales.length) {
    summary = `📅 สรุปยอดขายเดือน ${month}\nไม่มีรายการขายในเดือนนี้`;
  } else {
    const best = dayRows.reduce((a, b) => (b[1].revenue > a[1].revenue ? b : a));
    const avg = revenue / dayRows.length;
    const L = [
      `📅 สรุปยอดขายเดือน ${month}`,
      `• จำนวนบิล: ${sales.length} · หน่วยที่ขาย: ${totalQty}`,
      `• ยอดขายรวม: ${money(revenue)} บาท`,
      `• วันที่มีขาย: ${dayRows.length} วัน · เฉลี่ย ${money(avg)} บาท/วัน`,
      `• วันขายดีสุด: ${best[0]} (${money(best[1].revenue)} บาท)`,
      ``,
      `เทียบรายวัน:`,
    ];
    dayRows.forEach(([d, e]) =>
      L.push(
        `   ${d} · ${e.bills} บิล · ${e.qty} หน่วย · ${money(e.revenue)} บาท`,
      ),
    );
    if (top.length) {
      L.push(``, `ขายดี (ตามจำนวน):`);
      top
        .slice(0, 10)
        .forEach(([d, q], i) => L.push(`   ${i + 1}. ${d} — ${q}`));
    }
    if (!dateField)
      L.push(
        ``,
        `(หมายเหตุ: ไม่พบฟิลด์ "Order Date"/"Created" จึงรวมใบขายที่ Done ทั้งหมด)`,
      );
    summary = L.join("\n");
  }

  emit("summary", summary);
  emit("month", month);
  emit("bills", sales.length);
  emit("totalQty", totalQty);
  emit("revenue", revenue);
  emit("activeDays", dayRows.length);
  console.log(summary);
})();
