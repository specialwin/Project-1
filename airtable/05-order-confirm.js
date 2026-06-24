/**
 * StockYa · Automation: ยืนยันใบสั่ง (ORDER) — ตัด/เพิ่มสต๊อกอัตโนมัติทั้งใบ
 * ------------------------------------------------------------------
 * ใบสั่ง 1 ใบ มีได้หลายรายการ (Order Items) และเป็นได้ 2 ชนิด:
 *   - Issue    = ใบเบิก/จ่ายออก  → ตัดสต๊อกตาม FIFO (ของออกจากคลัง)
 *   - Purchase = ใบสั่งซื้อเข้า   → เพิ่มสต๊อกเป็นล็อตใหม่ (ของเข้าคลัง)
 *
 * Trigger: When record matches conditions
 *   Table = Orders
 *   Conditions: Status = "Confirmed"
 *
 * Input variables:
 *   recordId  ←  Airtable record ID ของ Order (trigger record)
 *
 * ความปลอดภัย: ตรวจสต๊อกรวมทั้งใบก่อน (แบบจำลองการตัดสะสมข้ามรายการ)
 *   ถ้ารายการใดสต๊อกไม่พอ/ข้อมูลไม่ครบ → ตั้ง Status = Error และ "ไม่ตัดอะไรเลย"
 */
await (async () => {
  const cfg = input.config();
  const Orders = base.getTable("Orders");
  const OrderItems = base.getTable("Order Items");
  const Lots = base.getTable("Lots");
  const Transactions = base.getTable("Transactions");

  const order = await Orders.selectRecordAsync(cfg.recordId);
  if (!order) {
    console.log("ไม่พบ Order record");
    return;
  }
  const setOrder = (status, msg) =>
    Orders.updateRecordAsync(order.id, {
      Status: { name: status },
      Result: msg,
    });
  const batchU = async (t, r) => {
    for (let i = 0; i < r.length; i += 50)
      await t.updateRecordsAsync(r.slice(i, i + 50));
  };
  const batchC = async (t, r) => {
    for (let i = 0; i < r.length; i += 50)
      await t.createRecordsAsync(r.slice(i, i + 50));
  };

  try {
    const typeName = (order.getCellValue("Type") || {}).name;
    if (!["Purchase", "Issue"].includes(typeName))
      throw new Error("Type ของใบสั่งต้องเป็น Purchase หรือ Issue");

    const wh = order.getCellValue("Warehouse");
    if (!wh || !wh.length) throw new Error("ยังไม่ได้เลือกคลัง (Warehouse)");
    const whId = wh[0].id;

    // รายการในใบสั่ง
    const itemsQ = await OrderItems.selectRecordsAsync({
      fields: ["Order", "Drug", "Quantity", "Lot", "Lot No", "Expiry Date", "Note"],
    });
    const items = itemsQ.records.filter(
      (r) => (r.getCellValue("Order") || [])[0]?.id === order.id,
    );
    if (!items.length) throw new Error("ใบสั่งนี้ยังไม่มีรายการ (Order Items)");

    // สำเนา Lots ไว้จำลองการตัดสะสม
    const lotsQ = await Lots.selectRecordsAsync({
      fields: ["Lot No", "Drug", "Warehouse", "Expiry Date", "Quantity", "Received Date"],
      sorts: [
        { field: "Expiry Date", direction: "asc" },
        { field: "Received Date", direction: "asc" },
      ],
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expOf = (r) => String(r.getCellValue("Expiry Date") || "").slice(0, 10);

    const work = lotsQ.records.map((r) => ({
      id: r.id,
      lotNo: r.getCellValueAsString("Lot No"),
      drugId: (r.getCellValue("Drug") || [])[0]?.id,
      whId: (r.getCellValue("Warehouse") || [])[0]?.id,
      exp: expOf(r),
      expired: !!(
        r.getCellValue("Expiry Date") && new Date(r.getCellValue("Expiry Date")) < today
      ),
      qty: r.getCellValue("Quantity") || 0,
      changed: false,
    }));
    const newLots = [];
    const txns = [];
    const itemResults = [];
    const today10 = new Date().toISOString().slice(0, 10);

    for (const it of items) {
      const drug = it.getCellValue("Drug");
      const qty = it.getCellValue("Quantity");
      const note = it.getCellValueAsString("Note");
      if (!drug || !drug.length) throw new Error("มีรายการที่ยังไม่ได้เลือกยา");
      if (!qty || qty <= 0) throw new Error("จำนวนในรายการต้องมากกว่า 0");
      const drugId = drug[0].id;

      if (typeName === "Issue") {
        // ตัดออกตาม FIFO (เลือกล็อตเองได้ผ่านฟิลด์ Lot)
        const manual = it.getCellValue("Lot");
        let cands = work.filter(
          (w) => w.drugId === drugId && w.whId === whId && w.qty > 0 && !w.expired,
        );
        if (manual && manual.length) {
          cands = cands.filter((w) => w.id === manual[0].id);
          if (!cands.length)
            throw new Error("มีรายการที่เลือกล็อตเองแต่ล็อตนั้นใช้ไม่ได้");
        }
        const avail = cands.reduce((s, w) => s + w.qty, 0);
        if (avail < qty)
          throw new Error(`สต๊อกไม่พอสำหรับยาในรายการ ต้องการ ${qty} แต่มี ${avail}`);

        let remaining = qty;
        for (const w of cands) {
          if (remaining <= 0) break;
          const take = Math.min(w.qty, remaining);
          remaining -= take;
          w.qty -= take;
          w.changed = true;
          txns.push({
            fields: {
              Type: { name: "ISSUE" },
              Drug: [{ id: drugId }],
              "Lot No": w.lotNo,
              "From Warehouse": [{ id: whId }],
              Quantity: take,
              Note: note,
              Order: [{ id: order.id }],
            },
          });
        }
        itemResults.push({ id: it.id, text: `เบิกออก ${qty} สำเร็จ` });
      } else {
        // Purchase — รับเข้าเป็นล็อต
        const lotNo = it.getCellValueAsString("Lot No").trim();
        const expiry = it.getCellValue("Expiry Date");
        if (!lotNo) throw new Error("รายการสั่งซื้อต้องมีเลขล็อต (Lot No)");
        if (!expiry) throw new Error("รายการสั่งซื้อต้องมีวันหมดอายุ (Expiry Date)");
        const exp = String(expiry).slice(0, 10);

        const match = (w) =>
          w.drugId === drugId && w.whId === whId && w.lotNo === lotNo && w.exp === exp;
        let target = work.find(match) || newLots.find(match);
        if (target) {
          target.qty += qty;
          if (target.id) target.changed = true;
        } else {
          newLots.push({ lotNo, drugId, whId, exp, qty });
        }
        txns.push({
          fields: {
            Type: { name: "RECEIVE" },
            Drug: [{ id: drugId }],
            "Lot No": lotNo,
            "To Warehouse": [{ id: whId }],
            Quantity: qty,
            Note: note,
            Order: [{ id: order.id }],
          },
        });
        itemResults.push({ id: it.id, text: `รับเข้า ${qty} · ล็อต ${lotNo}` });
      }
    }

    // เขียนผลลัพธ์จริงทั้งหมด (หลังผ่านการตรวจครบแล้ว)
    const lotUpdates = work
      .filter((w) => w.changed)
      .map((w) => ({ id: w.id, fields: { Quantity: w.qty } }));
    const lotCreates = newLots.map((w) => ({
      fields: {
        "Lot No": w.lotNo,
        Drug: [{ id: w.drugId }],
        Warehouse: [{ id: w.whId }],
        "Expiry Date": w.exp,
        Quantity: w.qty,
        "Received Date": today10,
      },
    }));

    await batchU(Lots, lotUpdates);
    await batchC(Lots, lotCreates);
    await batchC(Transactions, txns);
    await batchU(
      OrderItems,
      itemResults.map((r) => ({ id: r.id, fields: { "Line Result": r.text } })),
    );

    await setOrder(
      "Done",
      `${typeName === "Issue" ? "เบิกจ่าย" : "รับเข้า"} ${items.length} รายการ สำเร็จ`,
    );
    console.log("ORDER สำเร็จ");
  } catch (e) {
    await setOrder("Error", e.message);
    console.log("ORDER ผิดพลาด:", e.message);
  }
})();
