/**
 * StockYa · Automation: ย้ายคลัง (TRANSFER) — ตัดต้นทางตาม FIFO แล้วไปเพิ่มปลายทาง
 * ------------------------------------------------------------------
 * Trigger: When record matches conditions
 *   Table = Movements
 *   Conditions: Status = "New"  AND  Type = "Transfer"
 *
 * Input variables:
 *   recordId  ←  Airtable record ID ของ trigger record
 *
 * พฤติกรรม:
 *   - ตัดยาออกจาก "คลังต้นทาง" ตาม FIFO (เลือกล็อตเองได้ผ่านฟิลด์ Lot)
 *   - ไปเพิ่มที่ "คลังปลายทาง" โดยรวมกับล็อตเดิมที่ตรงกัน (เลขล็อต+วันหมดอายุ)
 *     ถ้ายังไม่มีก็สร้างล็อตใหม่
 */
await (async () => {
  const cfg = input.config();
  const Movements = base.getTable("Movements");
  const Lots = base.getTable("Lots");
  const Transactions = base.getTable("Transactions");

  const mv = await Movements.selectRecordAsync(cfg.recordId);
  if (!mv) {
    console.log("ไม่พบ Movement record");
    return;
  }
  const setResult = (status, msg) =>
    Movements.updateRecordAsync(mv.id, {
      Status: { name: status },
      Result: msg,
    });
  const batchUpdate = async (table, recs) => {
    for (let i = 0; i < recs.length; i += 50)
      await table.updateRecordsAsync(recs.slice(i, i + 50));
  };
  const batchCreate = async (table, recs) => {
    for (let i = 0; i < recs.length; i += 50)
      await table.createRecordsAsync(recs.slice(i, i + 50));
  };

  try {
    const drug = mv.getCellValue("Drug");
    const fromWh = mv.getCellValue("From Warehouse");
    const toWh = mv.getCellValue("To Warehouse");
    const manualLot = mv.getCellValue("Lot");
    const qty = mv.getCellValue("Quantity");
    const note = mv.getCellValueAsString("Note");

    if (!drug || !drug.length) throw new Error("ยังไม่ได้เลือกยา");
    if (!fromWh || !fromWh.length) throw new Error("ยังไม่ได้เลือกคลังต้นทาง");
    if (!toWh || !toWh.length) throw new Error("ยังไม่ได้เลือกคลังปลายทาง");
    if (fromWh[0].id === toWh[0].id)
      throw new Error("คลังต้นทางและปลายทางต้องไม่ใช่คลังเดียวกัน");
    if (!qty || qty <= 0) throw new Error("จำนวนต้องมากกว่า 0");

    const drugId = drug[0].id;
    const fromId = fromWh[0].id;
    const toId = toWh[0].id;

    const q = await Lots.selectRecordsAsync({
      fields: ["Lot No", "Drug", "Warehouse", "Expiry Date", "Quantity"],
      sorts: [
        { field: "Expiry Date", direction: "asc" },
        { field: "Received Date", direction: "asc" },
      ],
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isExpired = (d) => d && new Date(d) < today;
    const expOf = (r) => String(r.getCellValue("Expiry Date") || "").slice(0, 10);

    // ล็อตต้นทางที่ใช้ได้
    let source = q.records.filter(
      (r) =>
        (r.getCellValue("Drug") || [])[0]?.id === drugId &&
        (r.getCellValue("Warehouse") || [])[0]?.id === fromId &&
        (r.getCellValue("Quantity") || 0) > 0 &&
        !isExpired(r.getCellValue("Expiry Date")),
    );
    if (manualLot && manualLot.length) {
      source = source.filter((r) => r.id === manualLot[0].id);
      if (!source.length)
        throw new Error("ล็อตที่เลือกใช้ไม่ได้ (หมดอายุ / ไม่มีคงเหลือ / คนละคลัง)");
    }

    const available = source.reduce(
      (s, r) => s + (r.getCellValue("Quantity") || 0),
      0,
    );
    if (available < qty)
      throw new Error(`สต๊อกต้นทางไม่พอ ต้องการ ${qty} แต่มี ${available}`);

    // ล็อตปลายทางที่มีอยู่แล้ว (ไว้รวมจำนวน)
    const destLots = q.records.filter(
      (r) =>
        (r.getCellValue("Drug") || [])[0]?.id === drugId &&
        (r.getCellValue("Warehouse") || [])[0]?.id === toId,
    );

    let remaining = qty;
    const sourceUpdates = [];
    const txns = [];
    const destIncById = new Map(); // recordId -> เพิ่มจำนวน
    const destNew = new Map(); // "lotNo|exp" -> {lotNo, exp, qty}

    for (const r of source) {
      if (remaining <= 0) break;
      const have = r.getCellValue("Quantity") || 0;
      const take = Math.min(have, remaining);
      remaining -= take;
      const lotNo = r.getCellValueAsString("Lot No");
      const exp = expOf(r);

      // ตัดต้นทาง
      sourceUpdates.push({ id: r.id, fields: { Quantity: have - take } });

      // เพิ่มปลายทาง — รวมกับล็อตเดิมถ้ามี
      const dest = destLots.find(
        (d) => d.getCellValueAsString("Lot No") === lotNo && expOf(d) === exp,
      );
      if (dest) {
        destIncById.set(dest.id, (destIncById.get(dest.id) || 0) + take);
      } else {
        const key = `${lotNo}|${exp}`;
        const cur = destNew.get(key) || { lotNo, exp, qty: 0 };
        cur.qty += take;
        destNew.set(key, cur);
      }

      txns.push({
        fields: {
          Type: { name: "TRANSFER" },
          Drug: [{ id: drugId }],
          "Lot No": lotNo,
          "From Warehouse": [{ id: fromId }],
          "To Warehouse": [{ id: toId }],
          Quantity: take,
          Note: note,
          Movement: [{ id: mv.id }],
        },
      });
    }

    // อัปเดตปลายทางที่มีอยู่แล้ว
    const destUpdates = [];
    for (const [id, inc] of destIncById) {
      const rec = destLots.find((d) => d.id === id);
      destUpdates.push({
        id,
        fields: { Quantity: (rec.getCellValue("Quantity") || 0) + inc },
      });
    }
    // สร้างล็อตใหม่ที่ปลายทาง
    const destCreates = [];
    for (const { lotNo, exp, qty: nq } of destNew.values()) {
      destCreates.push({
        fields: {
          "Lot No": lotNo,
          Drug: [{ id: drugId }],
          Warehouse: [{ id: toId }],
          "Expiry Date": exp,
          Quantity: nq,
          "Received Date": new Date().toISOString().slice(0, 10),
          Note: note,
        },
      });
    }

    await batchUpdate(Lots, sourceUpdates);
    await batchUpdate(Lots, destUpdates);
    await batchCreate(Lots, destCreates);
    await batchCreate(Transactions, txns);

    await setResult(
      "Done",
      `ย้าย ${qty} หน่วย จาก ${txns.length} ล็อต ไปยังคลังปลายทาง`,
    );
    console.log("TRANSFER สำเร็จ");
  } catch (e) {
    await setResult("Error", e.message);
    console.log("TRANSFER ผิดพลาด:", e.message);
  }
})();
