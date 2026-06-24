/**
 * StockYa · Automation: เบิกยาออก (ISSUE) — ตัดตามล็อตแบบ FIFO/FEFO
 * ------------------------------------------------------------------
 * Trigger: When record matches conditions
 *   Table = Movements
 *   Conditions: Status = "New"  AND  Type = "Issue"
 *
 * Input variables:
 *   recordId  ←  Airtable record ID ของ trigger record
 *
 * พฤติกรรม:
 *   - ปกติ: เลือกล็อตอัตโนมัติ เรียง "หมดอายุก่อน–ออกก่อน" ข้ามล็อตที่หมดอายุ
 *   - ถ้ากรอกฟิลด์ Lot (เลือกล็อตเอง): ตัดเฉพาะล็อตนั้น
 *   - สต๊อกไม่พอ / ล็อตหมดอายุ / เบิกเกิน: ตั้ง Status = Error และไม่ตัดอะไรเลย
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
    const manualLot = mv.getCellValue("Lot");
    const qty = mv.getCellValue("Quantity");
    const note = mv.getCellValueAsString("Note");

    if (!drug || !drug.length) throw new Error("ยังไม่ได้เลือกยา");
    if (!fromWh || !fromWh.length) throw new Error("ยังไม่ได้เลือกคลังต้นทาง");
    if (!qty || qty <= 0) throw new Error("จำนวนต้องมากกว่า 0");

    const drugId = drug[0].id;
    const whId = fromWh[0].id;

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

    let candidates = q.records.filter(
      (r) =>
        (r.getCellValue("Drug") || [])[0]?.id === drugId &&
        (r.getCellValue("Warehouse") || [])[0]?.id === whId &&
        (r.getCellValue("Quantity") || 0) > 0 &&
        !isExpired(r.getCellValue("Expiry Date")),
    );

    // เลือกล็อตเอง — override FIFO
    if (manualLot && manualLot.length) {
      candidates = candidates.filter((r) => r.id === manualLot[0].id);
      if (!candidates.length)
        throw new Error(
          "ล็อตที่เลือกใช้ไม่ได้ (หมดอายุ / ไม่มีคงเหลือ / คนละคลัง)",
        );
    }

    const available = candidates.reduce(
      (s, r) => s + (r.getCellValue("Quantity") || 0),
      0,
    );
    if (available < qty)
      throw new Error(`สต๊อกไม่พอ ต้องการ ${qty} แต่มีให้เบิก ${available}`);

    // จัดสรรตาม FIFO
    let remaining = qty;
    const lotUpdates = [];
    const txns = [];
    for (const r of candidates) {
      if (remaining <= 0) break;
      const have = r.getCellValue("Quantity") || 0;
      const take = Math.min(have, remaining);
      remaining -= take;
      lotUpdates.push({ id: r.id, fields: { Quantity: have - take } });
      txns.push({
        fields: {
          Type: { name: "ISSUE" },
          Drug: [{ id: drugId }],
          "Lot No": r.getCellValueAsString("Lot No"),
          "From Warehouse": [{ id: whId }],
          Quantity: take,
          Note: note,
          Movement: [{ id: mv.id }],
        },
      });
    }

    await batchUpdate(Lots, lotUpdates);
    await batchCreate(Transactions, txns);

    await setResult(
      "Done",
      `เบิกออก ${qty} หน่วย จาก ${txns.length} ล็อต: ` +
        txns.map((t) => `${t.fields["Lot No"]}(${t.fields.Quantity})`).join(", "),
    );
    console.log("ISSUE สำเร็จ");
  } catch (e) {
    await setResult("Error", e.message);
    console.log("ISSUE ผิดพลาด:", e.message);
  }
})();
