# StockYa · ระบบบริหารสต๊อกยา

เว็บแอปจัดการสต๊อกยาสำหรับโรงพยาบาล/คลินิก/ร้านยา ใช้งานได้ทั้งบนมือถือและคอมพิวเตอร์

## 🚀 Deploy ดู Preview บน Vercel (คลิกเดียว)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fspecialwin%2FProject-1%2Ftree%2Fclaude%2Ffriendly-cray-lzrd28&env=NEXTAUTH_SECRET&envDescription=key%20%E0%B8%AA%E0%B8%B8%E0%B9%88%E0%B8%A1%E0%B8%AA%E0%B8%B3%E0%B8%AB%E0%B8%A3%E0%B8%B1%E0%B8%9A%20NextAuth%20(%E0%B8%AA%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%87%E0%B8%94%E0%B9%89%E0%B8%A7%E0%B8%A2%20openssl%20rand%20-base64%2032)&project-name=stockya&repository-name=stockya)

กดปุ่มด้านบน → ระบบจะให้กรอก env **`NEXTAUTH_SECRET`** เพียงตัวเดียว → กด Deploy
ก็จะได้ลิงก์ `https://...vercel.app` ที่เปิดบนมือถือ/คอมได้ทันที (เริ่มต้นเป็นโหมด Demo)

ค่า `NEXTAUTH_SECRET` ใช้คำสั่งนี้สร้าง (หรือใส่ค่าสุ่มอะไรก็ได้ยาว ๆ):

```bash
openssl rand -base64 32
```

> ต้องการเก็บข้อมูลถาวร? เพิ่ม env `AIRTABLE_TOKEN` และ `AIRTABLE_BASE_ID`
> ในหน้า Settings → Environment Variables ของ Vercel (ดูหัวข้อ “ตั้งค่า Airtable”)
>
> หมายเหตุ: บน Vercel (serverless) โหมด Demo จะไม่เก็บข้อมูลถาวรระหว่างคำขอ
> — ใช้ดู UI ได้ แต่สำหรับใช้งานจริงควรต่อ Airtable

### Deploy จาก repo เดิม (ไม่สร้าง repo ใหม่)

ถ้าไม่อยาก clone เป็น repo ใหม่: เข้า https://vercel.com/new → **Import** repo
`specialwin/Project-1` → เลือก branch `claude/friendly-cray-lzrd28` →
เพิ่ม Environment Variable `NEXTAUTH_SECRET` → **Deploy**

## ความสามารถ

- 🔐 **หน้าเข้าสู่ระบบ** — ยืนยันตัวตนด้วยอีเมล/รหัสผ่าน (NextAuth)
- 💊 **ทะเบียนยาแบบหลาย Lot** — ยาแต่ละตัวมีได้หลาย Lot แต่ละ Lot มีวันหมดอายุของตัวเอง
- 📥 **รับยาเข้าสต๊อก** — บันทึก Lot ใหม่พร้อมวันหมดอายุ จำนวน และหมายเหตุ
- 📤 **เบิกยาออก** — ตัดสต๊อกอัตโนมัติตามหลัก **FIFO/FEFO** (Lot ที่หมดอายุก่อน–ออกก่อน)
- 🔁 **ย้ายคลัง** — โอนยาระหว่างคลัง ตัด Lot ตาม FIFO แล้วไปเพิ่มที่ปลายทาง
- 📝 **หมายเหตุ** — ทุกการเคลื่อนไหวใส่หมายเหตุได้ และเก็บเป็นประวัติ
- ⏰ **แจ้งเตือนยาหมดอายุ** — แยกสถานะ หมดอายุแล้ว / ใกล้หมดอายุมาก / ใกล้หมดอายุ
- 🗄️ **เชื่อมต่อ Airtable** — ใช้ Airtable เป็นฐานข้อมูลจริง
- 📱 **รองรับมือถือและคอม** — Responsive + ติดตั้งเป็น PWA บน iPhone/Android ได้

## เทคโนโลยี

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + UI primitives สไตล์ shadcn
- NextAuth (Credentials) + bcrypt
- ชั้นข้อมูลแบบสลับได้: **Airtable** (จริง) หรือ **In-memory** (Demo)

## เริ่มต้นใช้งาน

```bash
cp .env.example .env
npm install
npm run dev
```

เปิด http://localhost:3000 — ถ้ายังไม่ตั้งค่า Airtable ระบบจะใช้ **โหมด Demo**
(ข้อมูลตัวอย่างในหน่วยความจำ) โดยอัตโนมัติ เข้าสู่ระบบด้วย:

```
admin@stockya.local / 1234      (ผู้ดูแลระบบ)
staff@stockya.local / 1234      (เภสัชกร)
```

> โหมด Demo: ข้อมูลจะรีเซ็ตเมื่อรีสตาร์ทเซิร์ฟเวอร์ — เหมาะสำหรับทดลองใช้งาน
> เมื่อต้องการเก็บข้อมูลถาวร ให้ตั้งค่า Airtable ตามด้านล่าง

## ตั้งค่า Airtable

1. สร้าง **Base** ใหม่ใน Airtable แล้วสร้างตาราง 5 ตารางตามโครงสร้างนี้
   (ชนิดฟิลด์ทั้งหมดใช้ **Single line text** ได้ ยกเว้นที่ระบุ):

   **Users**
   | ฟิลด์ | ชนิด |
   |---|---|
   | Email | Single line text |
   | Name | Single line text |
   | PasswordHash | Single line text (bcrypt hash) |
   | Role | Single line text (`admin` / `staff`) |

   **Warehouses** — `Name`, `Code`, `Location`, `Note`

   **Drugs** — `Code`, `Name`, `GenericName`, `Unit`, `Category`, `MinQty` (Number), `Note`

   **Lots** — `DrugId`, `WarehouseId`, `LotNo`, `ExpiryDate` (Date),
   `Quantity` (Number), `ReceivedDate` (Date), `Note`
   > `DrugId` / `WarehouseId` เก็บเป็น **record id** ของตาราง Drugs/Warehouses (text)

   **Transactions** — `Type` (`RECEIVE`/`ISSUE`/`TRANSFER`/`ADJUST`),
   `DrugId`, `LotNo`, `FromWarehouseId`, `ToWarehouseId`, `Quantity` (Number),
   `Note`, `UserEmail`, `CreatedAt` (Date with time)

2. สร้าง Personal Access Token ที่ https://airtable.com/create/tokens
   ให้สิทธิ์ `data.records:read`, `data.records:write` กับ Base ที่สร้าง

3. ใส่ค่าใน `.env`:

   ```env
   AIRTABLE_TOKEN="patXXXXXXXX"
   AIRTABLE_BASE_ID="appXXXXXXXX"
   ```

4. (ทางเลือก) เติมข้อมูลตัวอย่าง + บัญชีผู้ใช้เข้า Airtable:

   ```bash
   npm run airtable:setup
   ```

เมื่อมี `AIRTABLE_TOKEN` และ `AIRTABLE_BASE_ID` ครบ ระบบจะสลับมาใช้ Airtable ทันที

## หลักการ FIFO/FEFO

เมื่อ **เบิกออก** หรือ **ย้ายคลัง** ระบบจะเลือก Lot ให้อัตโนมัติโดย:

1. เรียงตาม **วันหมดอายุ** จากน้อยไปมาก (หมดอายุก่อน–ออกก่อน)
2. ถ้าวันหมดอายุเท่ากัน เรียงตาม **วันรับเข้า**
3. **ข้าม Lot ที่หมดอายุแล้ว** (ต้องจัดการแยกผ่านการปรับปรุง/ทำลาย)

ถ้าจำนวนไม่พอ ระบบจะปฏิเสธพร้อมแจ้งจำนวนที่ขาด

## การตั้งค่าแจ้งเตือนหมดอายุ

ปรับใน `.env`:

```env
EXPIRY_WARN_DAYS="90"       # เริ่มเตือน "ใกล้หมดอายุ" เมื่อเหลือ ≤ 90 วัน
EXPIRY_CRITICAL_DAYS="30"   # เตือน "ใกล้หมดอายุมาก" เมื่อเหลือ ≤ 30 วัน
```

## แผนผังหน้าจอ

| เส้นทาง | หน้าที่ |
|---|---|
| `/signin` | เข้าสู่ระบบ |
| `/` | ภาพรวม: สรุปสต๊อก แจ้งเตือนหมดอายุ สต๊อกต่ำ ทางลัด |
| `/stock` | สต๊อกคงเหลือ แยกตามยา/คลัง/Lot |
| `/receive` | รับยาเข้า (เพิ่ม Lot + วันหมดอายุ) |
| `/issue` | เบิกยาออก (FIFO) |
| `/transfer` | ย้ายคลัง (FIFO) |
| `/alerts` | แจ้งเตือนยาหมดอายุ |
| `/drugs` | จัดการทะเบียนยาและคลัง |
| `/history` | ประวัติการเคลื่อนไหวทั้งหมด |

## โครงสร้างไฟล์

```
src/
  app/
    signin/page.tsx            หน้าเข้าสู่ระบบ
    api/auth/[...nextauth]      NextAuth
    (app)/
      layout.tsx               เปลือกแอป + เมนู + ป้ายแจ้งเตือน
      page.tsx                 ภาพรวม
      stock|receive|issue|transfer|alerts|drugs|history/page.tsx
      actions.ts               server actions (รับเข้า/เบิก/ย้าย/เพิ่มยา/เพิ่มคลัง)
  components/
    app-nav.tsx                เมนูแบบ responsive
    forms/                     ฟอร์มฝั่ง client (useFormState)
    ui/                        button, card, input, select, textarea, badge, label
    expiry-badge.tsx
  lib/
    types.ts                   โครงสร้างข้อมูล
    config.ts                  อ่าน env (Airtable, วันแจ้งเตือน)
    auth.ts / session.ts       NextAuth + helper
    expiry.ts                  คำนวณสถานะหมดอายุ
    format.ts                  ฟอร์แมตวันที่/ตัวเลขแบบไทย
    stock.ts                   ตรรกะหลัก: FIFO, รับเข้า, เบิก, ย้าย, สรุป
    store/
      index.ts                 เลือก backend (Airtable หรือ Demo)
      types.ts                 interface ชั้นข้อมูล
      memory.ts                ฐานข้อมูล Demo ในหน่วยความจำ
      airtable.ts              ชั้นข้อมูล Airtable
      airtable-client.ts       REST client ของ Airtable
      seed.ts                  ข้อมูลตัวอย่าง
scripts/
  airtable-setup.ts            เติมข้อมูลตัวอย่างเข้า Airtable
```

## ติดตั้งเป็นแอปบนมือถือ (PWA)

เปิดเว็บใน Safari (iPhone) หรือ Chrome (Android) → เมนูแชร์ →
“เพิ่มไปยังหน้าจอโฮม” แอปจะเปิดแบบเต็มจอเหมือนแอปเนทีฟ
(ต้องรันผ่าน HTTPS สำหรับการติดตั้งบนอุปกรณ์จริง เช่น deploy ขึ้น Vercel)
