/**
 * StockYa · ตรวจสอบ Schema ของ Airtable ก่อนใช้งาน
 * ------------------------------------------------------------------
 * วิธีใช้: Extensions → Scripting → วาง code นี้ → Run
 * (รันมือ ไม่ใช่ Automation) จะรายงานว่าตาราง/ฟิลด์/ตัวเลือก single-select
 * ไหนยังขาดหรือสะกดผิด เทียบกับที่สคริปต์ทั้งหมดต้องใช้
 */

// ฟิลด์ที่ "ต้องมี" (สคริปต์อ่าน/เขียนจริง) และ "มีก็ดี" (optional)
const SCHEMA = {
  Drugs: {
    required: ["Name", "Code", "Unit"],
    optional: ["Generic Name", "Category", "Min Qty", "Price", "Note"],
  },
  Warehouses: {
    required: ["Name"],
    optional: ["Code", "Location", "Note"],
  },
  Lots: {
    required: [
      "Lot No",
      "Drug",
      "Warehouse",
      "Expiry Date",
      "Quantity",
      "Received Date",
      "Note",
    ],
    optional: ["Days To Expiry"],
  },
  Transactions: {
    required: [
      "Type",
      "Drug",
      "Lot No",
      "From Warehouse",
      "To Warehouse",
      "Quantity",
      "Note",
      "Order",
    ],
    optional: ["Movement", "Created At"],
  },
  Orders: {
    required: ["Type", "Warehouse", "Status", "Result"],
    optional: ["Order No", "Party", "Order Date", "Total"],
  },
  "Order Items": {
    required: [
      "Order",
      "Drug",
      "Quantity",
      "Lot",
      "Lot No",
      "Expiry Date",
      "Note",
      "Line Result",
    ],
    optional: ["Unit Price", "Line Total"],
  },
  // Movements ใช้เฉพาะโฟลว์ใบงานเดี่ยว (01–03) — ถ้าไม่ใช้ ข้ามได้
  Movements: {
    optionalTable: true,
    required: [
      "Type",
      "Drug",
      "From Warehouse",
      "To Warehouse",
      "Lot",
      "Lot No",
      "Expiry Date",
      "Quantity",
      "Note",
      "Status",
      "Result",
    ],
    optional: [],
  },
};

// ตัวเลือก single-select ที่ต้องมี (สะกดตรงเป๊ะ)
const SELECTS = {
  "Transactions.Type": ["RECEIVE", "ISSUE", "TRANSFER"],
  "Orders.Type": ["Sale", "Issue", "Purchase"],
  "Orders.Status": ["Draft", "Confirmed", "Done", "Error"],
  "Movements.Type": ["Receive", "Issue", "Transfer"],
  "Movements.Status": ["New", "Done", "Error"],
};

const tablesByName = {};
for (const t of base.tables) tablesByName[t.name] = t;

const problems = [];
const notes = [];

for (const [tableName, spec] of Object.entries(SCHEMA)) {
  const table = tablesByName[tableName];
  if (!table) {
    if (spec.optionalTable) {
      notes.push(`ℹ️ ไม่มีตาราง "${tableName}" (ไม่บังคับ — ข้ามได้ถ้าไม่ใช้)`);
    } else {
      problems.push(`❌ ขาดตาราง "${tableName}"`);
    }
    continue;
  }
  const fieldNames = new Set(table.fields.map((f) => f.name));
  for (const f of spec.required) {
    if (!fieldNames.has(f))
      problems.push(`❌ ตาราง "${tableName}" ขาดฟิลด์ "${f}"`);
  }
  for (const f of spec.optional || []) {
    if (!fieldNames.has(f))
      notes.push(`ℹ️ ตาราง "${tableName}" ยังไม่มีฟิลด์ "${f}" (ไม่บังคับ)`);
  }
}

// ตรวจตัวเลือก single-select
for (const [key, options] of Object.entries(SELECTS)) {
  const [tableName, fieldName] = key.split(".");
  const table = tablesByName[tableName];
  if (!table) continue; // รายงานขาดตารางไปแล้ว
  const field = table.fields.find((f) => f.name === fieldName);
  if (!field) continue; // รายงานขาดฟิลด์ไปแล้ว
  const choices = (field.options && field.options.choices) || [];
  const choiceNames = new Set(choices.map((c) => c.name));
  for (const opt of options) {
    if (!choiceNames.has(opt))
      problems.push(
        `❌ "${tableName}.${fieldName}" ขาดตัวเลือก "${opt}" (single-select)`,
      );
  }
}

// สรุปผล
if (typeof output.markdown === "function") {
  output.markdown(`# ผลตรวจ Schema — StockYa`);
  if (problems.length === 0) {
    output.markdown(`## ✅ ผ่านครบ — พร้อมตั้ง Automation ได้เลย`);
  } else {
    output.markdown(`## ⚠️ พบ ${problems.length} จุดที่ต้องแก้`);
    output.markdown(problems.map((p) => `- ${p}`).join("\n"));
  }
  if (notes.length) {
    output.markdown(`### หมายเหตุ (ไม่บังคับ)`);
    output.markdown(notes.map((n) => `- ${n}`).join("\n"));
  }
}

console.log(
  problems.length === 0
    ? "✅ Schema ผ่านครบ"
    : `⚠️ พบปัญหา ${problems.length} จุด:\n` + problems.join("\n"),
);
if (notes.length) console.log("\n" + notes.join("\n"));
