/**
 * StockYa · ข้อมูลตัวอย่าง (รันครั้งเดียวเพื่อทดลอง)
 * ------------------------------------------------------------------
 * วิธีใช้: เปิด Extensions → Scripting → วาง code นี้ → Run
 * (ไม่ใช่ Automation — เป็นสคริปต์รันมือเพื่อเติมข้อมูลเริ่มต้น)
 *
 * ต้องสร้างตาราง Drugs, Warehouses, Lots ตาม SCHEMA ก่อน
 */
const Warehouses = base.getTable("Warehouses");
const Drugs = base.getTable("Drugs");
const Lots = base.getTable("Lots");

const daysFromNow = (d) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

// คลัง
const whIds = await Warehouses.createRecordsAsync([
  { fields: { Name: "คลังกลาง", Code: "MAIN", Location: "อาคาร A ชั้น 1" } },
  { fields: { Name: "ห้องจ่ายยา OPD", Code: "OPD", Location: "อาคาร B ชั้น 1" } },
]);
const [MAIN, OPD] = whIds;

// ยา
const drugIds = await Drugs.createRecordsAsync([
  {
    fields: {
      Code: "MED-001",
      Name: "Paracetamol 500 mg",
      "Generic Name": "Paracetamol",
      Unit: "เม็ด",
      Category: "ยาแก้ปวด/ลดไข้",
      "Min Qty": 500,
    },
  },
  {
    fields: {
      Code: "MED-002",
      Name: "Amoxicillin 500 mg",
      "Generic Name": "Amoxicillin",
      Unit: "แคปซูล",
      Category: "ยาปฏิชีวนะ",
      "Min Qty": 300,
    },
  },
]);
const [PARA, AMOX] = drugIds;

// ล็อต (ใส่หลายล็อตเพื่อโชว์ FIFO + ใกล้/หมดอายุ)
await Lots.createRecordsAsync([
  {
    fields: {
      "Lot No": "PA2401",
      Drug: [{ id: PARA }],
      Warehouse: [{ id: MAIN }],
      "Expiry Date": daysFromNow(20),
      Quantity: 400,
      "Received Date": daysFromNow(-300),
    },
  },
  {
    fields: {
      "Lot No": "PA2402",
      Drug: [{ id: PARA }],
      Warehouse: [{ id: MAIN }],
      "Expiry Date": daysFromNow(200),
      Quantity: 1000,
      "Received Date": daysFromNow(-120),
    },
  },
  {
    fields: {
      "Lot No": "AM2310",
      Drug: [{ id: AMOX }],
      Warehouse: [{ id: MAIN }],
      "Expiry Date": daysFromNow(-5), // หมดอายุแล้ว
      Quantity: 80,
      "Received Date": daysFromNow(-400),
    },
  },
  {
    fields: {
      "Lot No": "AM2401",
      Drug: [{ id: AMOX }],
      Warehouse: [{ id: MAIN }],
      "Expiry Date": daysFromNow(75),
      Quantity: 250,
      "Received Date": daysFromNow(-60),
    },
  },
]);

console.log("เติมข้อมูลตัวอย่างเรียบร้อย ✓");
