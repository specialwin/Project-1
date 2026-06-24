/**
 * StockYa · Script: รายงานสต๊อกคงเหลือ + มูลค่าคงคลัง
 * ------------------------------------------------------------------
 * รวมยอดคงเหลือจากตาราง Lots ตามรายยา (และรายคลัง) คำนวณมูลค่าคงคลัง
 * พร้อมเตือนยาที่ต่ำกว่าขั้นต่ำ และยอดที่หมดอายุค้างสต๊อก
 *
 * รันได้ 2 แบบ:
 *   - Scripting extension (กดรันเอง) → ดูผลใน console
 *   - Automation "Run a script" (ตั้งเวลา) → ใช้ output vars ต่อ (ส่งอีเมล/LINE)
 *
 * Output variables:
 *   summary · totalQty · totalValue · lowStockCount · expiredQty
 *
 * มูลค่า: ใช้ฟิลด์ Drugs."Price" ถ้ามี (มูลค่า = คงเหลือที่ยังไม่หมดอายุ × ราคา)
 * ขั้นต่ำ: ใช้ฟิลด์ Drugs."Min Qty" ถ้ามี (เตือนเมื่อคงเหลือ < ขั้นต่ำ)
 */
await (async () => {
  const emit = (k, v) => {
    if (typeof output !== "undefined" && output && output.set) output.set(k, v);
  };
  const Lots = base.getTable("Lots");
  const Drugs = base.getTable("Drugs");

  const drugFields = new Set(Drugs.fields.map((f) => f.name));
  const hasPrice = drugFields.has("Price");
  const hasMin = drugFields.has("Min Qty");
  const hasUnit = drugFields.has("Unit");

  const drugsQ = await Drugs.selectRecordsAsync({
    fields: [
      "Name",
      ...(hasPrice ? ["Price"] : []),
      ...(hasMin ? ["Min Qty"] : []),
      ...(hasUnit ? ["Unit"] : []),
    ],
  });
  const drugInfo = new Map();
  for (const d of drugsQ.records)
    drugInfo.set(d.id, {
      name: d.getCellValueAsString("Name"),
      price: hasPrice ? d.getCellValue("Price") || 0 : 0,
      min: hasMin ? d.getCellValue("Min Qty") || 0 : 0,
      unit: hasUnit ? d.getCellValueAsString("Unit") : "",
    });

  const lotsQ = await Lots.selectRecordsAsync({
    fields: ["Drug", "Warehouse", "Expiry Date", "Quantity"],
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // รวมตามยา และตามคลัง
  const byDrug = new Map(); // drugId -> {name, avail, expired}
  const byWh = new Map(); // whName -> {qty, value}
  let totalQty = 0;
  let totalValue = 0;
  let expiredQty = 0;

  for (const r of lotsQ.records) {
    const qty = r.getCellValue("Quantity") || 0;
    if (qty <= 0) continue;
    const drug = (r.getCellValue("Drug") || [])[0];
    const drugId = drug?.id || "(ไม่ระบุ)";
    const info = drugInfo.get(drugId) || {
      name: drug?.name || "(ไม่ระบุยา)",
      price: 0,
      min: 0,
      unit: "",
    };
    const exp = r.getCellValue("Expiry Date");
    const isExpired = !!(exp && new Date(exp) < today);

    let e = byDrug.get(drugId);
    if (!e)
      byDrug.set(
        drugId,
        (e = { name: info.name, unit: info.unit, min: info.min, price: info.price, avail: 0, expired: 0 }),
      );
    if (isExpired) {
      e.expired += qty;
      expiredQty += qty;
    } else {
      e.avail += qty;
      totalQty += qty;
      totalValue += qty * info.price;
      const whName = (r.getCellValue("Warehouse") || [])[0]?.name || "(ไม่ระบุคลัง)";
      let w = byWh.get(whName);
      if (!w) byWh.set(whName, (w = { qty: 0, value: 0 }));
      w.qty += qty;
      w.value += qty * info.price;
    }
  }

  const money = (n) =>
    Math.round(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const today10 = new Date().toISOString().slice(0, 10);

  const drugRows = [...byDrug.values()]
    .filter((e) => e.avail > 0 || e.expired > 0)
    .sort((a, b) =>
      hasPrice ? b.avail * b.price - a.avail * a.price : b.avail - a.avail,
    );
  const lowStock = drugRows.filter((e) => hasMin && e.min > 0 && e.avail < e.min);

  const L = [`📦 รายงานสต๊อกคงเหลือ (ณ ${today10})`];
  if (hasPrice) L.push(`• มูลค่าคงคลังรวม: ${money(totalValue)} บาท`);
  L.push(`• จำนวนหน่วยคงเหลือรวม: ${totalQty}`);

  if (byWh.size > 1) {
    L.push(``, `แยกตามคลัง:`);
    [...byWh.entries()]
      .sort((a, b) => b[1].value - a[1].value || b[1].qty - a[1].qty)
      .forEach(([w, e]) =>
        L.push(
          `   ${w} · ${e.qty} หน่วย${hasPrice ? ` · ${money(e.value)} บาท` : ""}`,
        ),
      );
  }

  L.push(``, `รายการคงเหลือ:`);
  drugRows.forEach((e, i) => {
    const u = e.unit ? ` ${e.unit}` : " หน่วย";
    const val = hasPrice ? ` · ${money(e.avail * e.price)} บาท` : "";
    const low = hasMin && e.min > 0 && e.avail < e.min ? ` ⚠️ ต่ำกว่าขั้นต่ำ (${e.min})` : "";
    const exp = e.expired > 0 ? ` · 🛑 หมดอายุค้าง ${e.expired}` : "";
    L.push(`   ${i + 1}. ${e.name} — ${e.avail}${u}${val}${low}${exp}`);
  });

  if (lowStock.length)
    L.push(
      ``,
      `⚠️ ต่ำกว่าขั้นต่ำ ${lowStock.length} รายการ: ` +
        lowStock.map((e) => `${e.name} (${e.avail}/${e.min})`).join(", "),
    );
  if (expiredQty > 0)
    L.push(`🛑 มียาหมดอายุค้างสต๊อกรวม ${expiredQty} หน่วย (ควรตัดออก)`);

  const summary = drugRows.length ? L.join("\n") : `📦 ไม่มีสต๊อกคงเหลือ`;

  emit("summary", summary);
  emit("totalQty", totalQty);
  emit("totalValue", totalValue);
  emit("lowStockCount", lowStock.length);
  emit("expiredQty", expiredQty);
  console.log(summary);
})();
