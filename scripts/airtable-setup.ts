/**
 * นำข้อมูลตัวอย่าง (ผู้ใช้ คลัง ยา และ Lot) เข้าสู่ Airtable
 *
 * วิธีใช้:
 *   1) สร้าง Base ใน Airtable พร้อมตาราง 5 ตารางตามที่ระบุใน README
 *   2) ใส่ AIRTABLE_TOKEN และ AIRTABLE_BASE_ID ใน .env
 *   3) รัน:  npm run airtable:setup
 *
 * สคริปต์นี้แยกเป็นอิสระจากแอป (ไม่ใช้ alias @/) เพื่อให้รันด้วย tsx ได้ตรง ๆ
 */
import bcrypt from "bcryptjs";

// โหลด .env (Node 22+)
try {
  (process as unknown as { loadEnvFile: (p: string) => void }).loadEnvFile(
    ".env",
  );
} catch {
  /* ไม่มีไฟล์ .env ก็ใช้ environment ปัจจุบัน */
}

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE = process.env.AIRTABLE_BASE_ID;
const T = {
  users: process.env.AIRTABLE_TABLE_USERS ?? "Users",
  warehouses: process.env.AIRTABLE_TABLE_WAREHOUSES ?? "Warehouses",
  drugs: process.env.AIRTABLE_TABLE_DRUGS ?? "Drugs",
  lots: process.env.AIRTABLE_TABLE_LOTS ?? "Lots",
};

if (!TOKEN || !BASE) {
  console.error("ต้องตั้งค่า AIRTABLE_TOKEN และ AIRTABLE_BASE_ID ใน .env ก่อน");
  process.exit(1);
}

async function create(table: string, fields: Record<string, unknown>) {
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields, typecast: true }),
    },
  );
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  return (await res.json()) as { id: string };
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("กำลังเพิ่มผู้ใช้…");
  const pw = bcrypt.hashSync("1234", 8);
  await create(T.users, {
    Email: "admin@stockya.local",
    Name: "ผู้ดูแลระบบ",
    PasswordHash: pw,
    Role: "admin",
  });
  await create(T.users, {
    Email: "staff@stockya.local",
    Name: "เภสัชกร",
    PasswordHash: pw,
    Role: "staff",
  });

  console.log("กำลังเพิ่มคลัง…");
  const main_ = await create(T.warehouses, { Name: "คลังกลาง", Code: "MAIN" });
  const opd = await create(T.warehouses, { Name: "ห้องจ่ายยา OPD", Code: "OPD" });

  console.log("กำลังเพิ่มยา…");
  const para = await create(T.drugs, {
    Code: "MED-001",
    Name: "Paracetamol 500 mg",
    GenericName: "Paracetamol",
    Unit: "เม็ด",
    Category: "ยาแก้ปวด/ลดไข้",
    MinQty: 500,
  });
  const amox = await create(T.drugs, {
    Code: "MED-002",
    Name: "Amoxicillin 500 mg",
    GenericName: "Amoxicillin",
    Unit: "แคปซูล",
    Category: "ยาปฏิชีวนะ",
    MinQty: 300,
  });

  console.log("กำลังเพิ่ม Lot…");
  await create(T.lots, {
    DrugId: para.id,
    WarehouseId: main_.id,
    LotNo: "PA2401",
    ExpiryDate: isoDaysFromNow(20),
    Quantity: 400,
    ReceivedDate: isoDaysFromNow(-300),
  });
  await create(T.lots, {
    DrugId: para.id,
    WarehouseId: main_.id,
    LotNo: "PA2402",
    ExpiryDate: isoDaysFromNow(200),
    Quantity: 1000,
    ReceivedDate: isoDaysFromNow(-120),
  });
  await create(T.lots, {
    DrugId: para.id,
    WarehouseId: opd.id,
    LotNo: "PA2401",
    ExpiryDate: isoDaysFromNow(20),
    Quantity: 150,
    ReceivedDate: isoDaysFromNow(-90),
  });
  await create(T.lots, {
    DrugId: amox.id,
    WarehouseId: main_.id,
    LotNo: "AM2401",
    ExpiryDate: isoDaysFromNow(75),
    Quantity: 250,
    ReceivedDate: isoDaysFromNow(-60),
  });

  console.log("เสร็จสิ้น ✓  เข้าสู่ระบบด้วย admin@stockya.local / 1234");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
