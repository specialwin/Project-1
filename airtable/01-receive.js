/**
 * StockYa · Automation: รับยาเข้าสต๊อก (RECEIVE)
 * ------------------------------------------------------------------
 * วาง code นี้ใน Automation action "Run a script"
 *
 * Trigger ที่แนะนำ: When record matches conditions
 *   Table = Movements
 *   Conditions: Status = "New"  AND  Type = "Receive"
 *
 * Input variables (ตั้งในแผง Run a script ด้านซ้าย):
 *   recordId  ←  ดึงจาก "Airtable record ID" ของ trigger record
 *
 * ผลลัพธ์: สร้าง/รวมล็อตในตาราง Lots + บันทึก Transactions + ตั้ง Status = Done/Error
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

  try {
    const drug = mv.getCellValue("Drug");
    const toWh = mv.getCellValue("To Warehouse");
    const lotNo = mv.getCellValueAsString("Lot No").trim();
    const expiry = mv.getCellValue("Expiry Date");
    const qty = mv.getCellValue("Quantity");
    const note = mv.getCellValueAsString("Note");

    if (!drug || !drug.length) throw new Error("ยังไม่ได้เลือกยา");
    if (!toWh || !toWh.length) throw new Error("ยังไม่ได้เลือกคลังปลายทาง");
    if (!lotNo) throw new Error("กรอกเลขล็อต (Lot No)");
    if (!expiry) throw new Error("กรอกวันหมดอายุ (Expiry Date)");
    if (!qty || qty <= 0) throw new Error("จำนวนต้องมากกว่า 0");

    const drugId = drug[0].id;
    const whId = toWh[0].id;
    const exp = String(expiry).slice(0, 10);

    // หาล็อตเดิมที่ตรงกัน (ยา + คลัง + เลขล็อต + วันหมดอายุ) เพื่อรวมจำนวน
    const q = await Lots.selectRecordsAsync({
      fields: ["Lot No", "Drug", "Warehouse", "Expiry Date", "Quantity"],
    });
    const existing = q.records.find(
      (r) =>
        (r.getCellValue("Drug") || [])[0]?.id === drugId &&
        (r.getCellValue("Warehouse") || [])[0]?.id === whId &&
        r.getCellValueAsString("Lot No").trim() === lotNo &&
        String(r.getCellValue("Expiry Date") || "").slice(0, 10) === exp,
    );

    if (existing) {
      await Lots.updateRecordAsync(existing.id, {
        Quantity: (existing.getCellValue("Quantity") || 0) + qty,
      });
    } else {
      await Lots.createRecordAsync({
        "Lot No": lotNo,
        Drug: [{ id: drugId }],
        Warehouse: [{ id: whId }],
        "Expiry Date": exp,
        Quantity: qty,
        "Received Date": new Date().toISOString().slice(0, 10),
        Note: note,
      });
    }

    await Transactions.createRecordAsync({
      Type: { name: "RECEIVE" },
      Drug: [{ id: drugId }],
      "Lot No": lotNo,
      "To Warehouse": [{ id: whId }],
      Quantity: qty,
      Note: note,
      Movement: [{ id: mv.id }],
    });

    await setResult("Done", `รับเข้า ${qty} หน่วย · ล็อต ${lotNo}`);
    console.log("RECEIVE สำเร็จ");
  } catch (e) {
    await setResult("Error", e.message);
    console.log("RECEIVE ผิดพลาด:", e.message);
  }
})();
