# StockYa บน Airtable (Automation + Script)

ทำระบบสต๊อกยาให้ทำงาน **ในตัว Airtable เอง** — ผู้ใช้แค่สร้าง "ใบสั่งงาน"
(record ในตาราง **Movements**) แล้ว **Automation** จะตัดสต๊อกตามล็อต (FIFO) ให้
อัตโนมัติ ส่วนการแจ้งเตือนยาหมดอายุใช้ Automation แบบไม่ต้องเขียนสคริปต์

> ⚠️ Airtable ไม่มี API สำหรับสร้าง Automation — ต้องตั้งค่าเองในหน้าเว็บ Airtable
> โดยใช้สคริปต์ในโฟลเดอร์นี้ (คัดลอกไปวางในแอ็กชัน “Run a script”)

มี 2 ทางให้สั่งงาน — ใช้ทางใดทางหนึ่งหรือทั้งคู่:
- **Movements** = ใบงานเดี่ยว (รับเข้า/เบิก/ย้าย ทีละรายการ)
- **Orders + Order Items** = ใบสั่งหลายรายการ (รายการสั่งซื้อเข้า / ใบเบิกจ่ายออก)

ทั้งคู่เขียนลง **Lots = สต๊อกจริง** และ **Transactions = บัญชีเดินรายการ** ชุดเดียวกัน

```
[A] Movements (Type=Receive/Issue/Transfer, Status=New)
[B] Orders (Type=Issue/Purchase, Status=Confirmed) + Order Items หลายรายการ
        │  (Automation trigger)
        ▼
   Run a script → ตัด/เพิ่ม Lots ตาม FIFO → สร้าง Transactions → ตั้ง Status=Done/Error + Result
```

---

## 1) โครงสร้างตาราง (Schema)

ใช้ **Linked record** สำหรับความสัมพันธ์ (idiomatic กับ Airtable / Interface / Form)

### Drugs
| ฟิลด์ | ชนิด |
|---|---|
| Name | Single line text |
| Code | Single line text |
| Generic Name | Single line text |
| Unit | Single line text |
| Category | Single line text |
| Min Qty | Number (integer) |
| Price | Currency / Number — ราคาขายต่อหน่วย (สำหรับ POS) |
| Note | Long text |

### Warehouses
`Name`, `Code`, `Location`, `Note` (ทั้งหมด text)

### Lots  ← สต๊อกจริง
| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| Lot No | Single line text | เลขล็อต |
| Drug | **Link → Drugs** | |
| Warehouse | **Link → Warehouses** | |
| Expiry Date | Date | วันหมดอายุ |
| Quantity | Number | คงเหลือในล็อต |
| Received Date | Date | วันรับเข้า |
| Note | Long text | |
| Days To Expiry | **Formula** | `DATETIME_DIFF({Expiry Date}, TODAY(), 'days')` |

### Transactions  ← เดินรายการอัตโนมัติ (อย่าแก้มือ)
| ฟิลด์ | ชนิด |
|---|---|
| Type | Single select: `RECEIVE` `ISSUE` `TRANSFER` |
| Drug | Link → Drugs |
| Lot No | Single line text |
| From Warehouse | Link → Warehouses |
| To Warehouse | Link → Warehouses |
| Quantity | Number |
| Note | Long text |
| Movement | Link → Movements |
| Order | Link → Orders |
| Created At | Created time |

### Orders  ← หัวใบสั่ง (รายการสั่งซื้อ / ใบเบิก)
| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| Order No | Autonumber | เลขที่ใบ (Airtable สร้างให้) |
| Type | Single select: `Sale` `Issue` `Purchase` | `Sale`=ขายหน้าร้าน POS (ตัดสต๊อก), `Issue`=เบิก/จ่ายออก (ตัดสต๊อก), `Purchase`=สั่งซื้อเข้า (เพิ่มสต๊อก) |
| Warehouse | Link → Warehouses | คลังที่ตัด (Sale/Issue) หรือรับเข้า (Purchase) |
| Party | Single line text | ลูกค้า (Sale) / ผู้ขอเบิก (Issue) / ผู้ขาย (Purchase) |
| Order Date | Date | วันที่ |
| Status | Single select: `Draft` `Confirmed` `Done` `Error` | ตั้งเป็น `Confirmed` เพื่อสั่งให้ตัด/เพิ่มสต๊อก |
| Total | Rollup → SUM(Order Items.Line Total) | ยอดรวม (POS) — ไม่บังคับ |
| Result | Long text | สคริปต์เขียนผลกลับ |
| Order Items | Link → Order Items | (เกิดอัตโนมัติจากการลิงก์ฝั่ง Order Items) |

### Order Items  ← รายการในใบสั่ง (1 ใบมีได้หลายรายการ)
| ฟิลด์ | ชนิด | ใช้ตอน |
|---|---|---|
| Order | Link → Orders | ทุกรายการ |
| Drug | Link → Drugs | ทุกรายการ |
| Quantity | Number | ทุกรายการ |
| Unit Price | Currency / Number | (POS) ราคาต่อหน่วย — ดึงค่าเริ่มจาก Drug.Price ด้วย Lookup ได้ |
| Line Total | Formula: `{Quantity} * {Unit Price}` | (POS) ยอดต่อรายการ — ไม่บังคับ |
| Lot | Link → Lots | (ทางเลือก) เลือกล็อตเองตอน Sale/Issue |
| Lot No | Single line text | Purchase |
| Expiry Date | Date | Purchase |
| Note | Long text | หมายเหตุ |
| Line Result | Long text | สคริปต์เขียนผลรายรายการ |

### Movements  ← ใบสั่งงานเดี่ยว (ทางเลือก — ใช้คู่กับ Orders หรือใช้แทนก็ได้)
| ฟิลด์ | ชนิด | ใช้ตอน |
|---|---|---|
| Type | Single select: `Receive` `Issue` `Transfer` | ทุกใบ |
| Drug | Link → Drugs | ทุกใบ |
| From Warehouse | Link → Warehouses | Issue, Transfer |
| To Warehouse | Link → Warehouses | Receive, Transfer |
| Lot | Link → Lots | (ทางเลือก) เลือกล็อตเองตอน Issue/Transfer |
| Lot No | Single line text | Receive |
| Expiry Date | Date | Receive |
| Quantity | Number | ทุกใบ |
| Note | Long text | หมายเหตุ |
| Status | Single select: `New` `Done` `Error` | ค่าเริ่มต้น = `New` |
| Result | Long text | สคริปต์เขียนผลลัพธ์กลับ |

> ตั้ง **default value ของ Status = `New`** (หรือใส่เองตอนสร้างแถว) เพื่อให้ Automation จับ

---

> ✅ **ตรวจ schema อัตโนมัติ:** หลังสร้างตาราง/ฟิลด์ครบแล้ว เปิด Extensions →
> Scripting → วาง `06-check-schema.js` → Run จะบอกว่ายังขาดตาราง/ฟิลด์/ตัวเลือก
> single-select ไหนหรือสะกดผิด ก่อนไปตั้ง Automation

---

## 2) ตั้งค่า Automation

แต่ละตัวใช้ trigger "When record matches conditions" + action "Run a script"
ต่างกันแค่ **ตาราง trigger / เงื่อนไข / ไฟล์สคริปต์**:

| Automation | ตาราง trigger | เงื่อนไข | สคริปต์ |
|---|---|---|---|
| รับเข้า (เดี่ยว) | Movements | Status=`New` และ Type=`Receive` | `01-receive.js` |
| เบิกออก (เดี่ยว) | Movements | Status=`New` และ Type=`Issue` | `02-issue.js` |
| ย้ายคลัง (เดี่ยว) | Movements | Status=`New` และ Type=`Transfer` | `03-transfer.js` |
| **ยืนยันใบสั่ง** | **Orders** | **Status=`Confirmed`** | **`05-order-confirm.js`** |

> ใช้ Movements (ใบงานเดี่ยว) หรือ Orders (ใบสั่งหลายรายการ) อย่างใดอย่างหนึ่ง
> หรือทั้งคู่ก็ได้ — ทุกตัวเขียนลง Lots/Transactions ชุดเดียวกัน
> **ใบสั่ง (Orders):** ตั้ง input `recordId` = Airtable record ID ของ **Order**

ขั้นตอน (ต่อ 1 Automation):

1. ไปแท็บ **Automations** → **Create automation**
2. **Trigger** → เลือก **When record matches conditions**
   - Table = **Movements**
   - Conditions = `Status` is `New` **และ** `Type` is `Receive` (ปรับตามตาราง)
3. **Add action** → **Run a script**
4. ในแผง script ด้านซ้าย เพิ่ม **Input variable**:
   - ชื่อ `recordId` → ค่า = เลือก **Airtable record ID** จาก trigger record
5. วางโค้ดจากไฟล์ที่ตรงกัน (เช่น `02-issue.js`) ลงในช่อง script
6. กด **Test** (สร้างแถวทดสอบใน Movements ก่อน) แล้ว **Turn on**

เสร็จแล้ว — เวลาจะเบิกยา ก็แค่สร้างแถวใน Movements:
`Type=Issue, Drug=…, From Warehouse=…, Quantity=…, Status=New`
ระบบจะตัดล็อตตาม FIFO ให้ แล้วเขียนผลลัพธ์ที่ฟิลด์ Result

### เลือกล็อตเอง (override FIFO)
ตอน Issue/Transfer ถ้าใส่ฟิลด์ **Lot** (ลิงก์ไปล็อตที่ต้องการ) ระบบจะตัด
เฉพาะล็อตนั้น ถ้าเว้นว่าง = อัตโนมัติตาม FIFO

---

## 3) แจ้งเตือนยาหมดอายุ (ไม่ต้องเขียนสคริปต์)

1. ที่ตาราง **Lots** สร้างฟิลด์ formula **Days To Expiry** (ตาม schema)
2. สร้าง **View** ชื่อ `ใกล้หมดอายุ` กรองด้วย:
   `Days To Expiry` ≤ `90` **และ** `Quantity` > `0` — เรียงตาม Days To Expiry
3. **Automations** → **Create automation**
   - Trigger = **At a scheduled time** (เช่น ทุกวัน 08:00)
   - Action = **Send email** → ใส่ผู้รับ → เนื้อหาเลือกแนบ records จาก View `ใกล้หมดอายุ`

ต้องการข้อความสรุปก้อนเดียว (เช่นส่ง LINE)? ใช้ `04-expiry-digest.js`
เป็นแอ็กชัน Run a script ก่อนแอ็กชัน Send email แล้วอ้างตัวแปร `summary`

---

## 4) หน้ารายการสั่งซื้อ (Orders) ด้วย Airtable Interface

ทำหน้าจอให้ผู้ใช้สร้างใบสั่ง เพิ่มรายการยา แล้วกดยืนยันให้ตัด/เพิ่มสต๊อก:

1. ไปแท็บ **Interfaces** → **Start building** → เลือกเลย์เอาต์ **Record review**
   หรือ **Blank**
2. **หน้ารายการใบสั่ง:** วาง element **List** ผูกกับตาราง **Orders**
   - แสดงคอลัมน์ Order No, Type, Warehouse, Status, Order Date
   - เพิ่ม filter ปุ่มสลับดู `Draft` / `Done` ได้
3. **ปุ่มสร้างใบใหม่:** เพิ่ม element **Button** → action **Create record** (ตาราง Orders)
   ตั้งค่าเริ่มต้น Status = `Draft`
4. **หน้ารายละเอียดใบสั่ง (record detail):**
   - แสดงฟิลด์หัวใบ: Type, Warehouse, Party, Order Date, Status, Result
   - วาง element **Grid/List ของ Order Items** (linked records ของใบนั้น)
     ให้ผู้ใช้ **+ เพิ่มรายการยา** (Drug, Quantity, และ Lot No/Expiry ถ้าเป็น Purchase)
5. **ปุ่มยืนยัน:** ให้ผู้ใช้เปลี่ยนฟิลด์ **Status เป็น `Confirmed`**
   (จะใช้ element Button + action *Update record* ตั้ง Status=`Confirmed` ก็ได้)
   → Automation `05-order-confirm.js` จะทำงานทันที ตัด/เพิ่มสต๊อกตามชนิดใบ
   แล้วเปลี่ยน Status เป็น `Done` (หรือ `Error` พร้อมเหตุผลในช่อง Result)

> ขั้นตอนใช้งานจริง: สร้างใบ (Draft) → เพิ่มรายการยา → เปลี่ยนเป็น Confirmed →
> ระบบตัด/เพิ่มสต๊อกอัตโนมัติ → ดูผลที่ Result และดูล็อตที่ถูกตัดได้ใน Transactions

### โหมดขายหน้าร้าน (POS)
ใช้ใบ **Type = `Sale`** สำหรับการขาย ตัดสต๊อกแบบ FIFO เหมือน Issue แต่เน้นความเร็ว:

- ที่ **Order Items** ตั้ง `Unit Price` ให้ **Lookup** ค่าจาก `Drug.Price` อัตโนมัติ
  แล้ว `Line Total` = `Quantity × Unit Price` ส่วน `Orders.Total` = Rollup รวมทุกบรรทัด
  → ได้ยอดบิลอัตโนมัติเหมือนเครื่อง POS
- ทำหน้า Interface แบบ **Record review**: ฝั่งซ้ายเป็นรายการบิล (Sale) ฝั่งขวาเป็น
  ตะกร้าสินค้า (Order Items) + ยอดรวม + ปุ่ม **“ปิดการขาย”** (Update record → Status=`Confirmed`)
- พอกดปิดการขาย → ตัดสต๊อกตาม FIFO ทันที + ขึ้นยอดรวมในช่อง Total + ลงบัญชี Transactions
- อยากให้ตัดทันทีตอนสร้างบิลโดยไม่ต้องมีปุ่ม: ตั้ง trigger ของ Automation เป็น
  Type=`Sale` และ Status=`Confirmed` แล้วให้ฟอร์ม/Interface ตั้ง Status เริ่มต้นเป็น `Confirmed`

### ทางเลือก UI อื่น
- **Airtable Form** — ฟอร์มกรอกใบงานเดี่ยว (Movements) สำหรับคนนอก
- **เว็บแอป StockYa** (ในโปรเจกต์นี้) — ใช้คู่กันได้ ดูหมายเหตุด้านล่าง

---

## 5) สรุปยอดขายรายวัน

ส่งสรุปยอดขายของแต่ละวันเข้าอีเมล/LINE อัตโนมัติด้วย `07-daily-sales.js`:

1. ไปแท็บ **Automations** → **Create automation**
2. **Trigger:** *At a scheduled time* → ตั้งทุกวัน เช่น **20:00**
   (อยากสรุป "เมื่อวาน" ตอนเช้า ก็ตั้งเช้าแล้วส่ง `dateISO` เป็นวันที่เมื่อวาน)
3. **Action:** *Run a script* → วางโค้ดจาก `07-daily-sales.js`
   - (ไม่บังคับ) เพิ่ม input variable ชื่อ `dateISO` ถ้าต้องการระบุวันเอง
4. **Action ถัดไป:** *Send email* (หรือ Send LINE/Slack) แล้วใส่ตัวแปร
   **`summary`** จากสเต็ปสคริปต์ลงในเนื้อหา

สคริปต์จะรายงาน: จำนวนบิล · จำนวนหน่วยที่ขาย · ยอดเงินรวม · รายการขายดี 10 อันดับ
และส่งออกตัวแปร `summary`, `count`, `totalQty`, `revenue` ให้สเต็ปถัดไปใช้ต่อ

> นับเฉพาะใบ **Type = `Sale`** ที่ **Status = `Done`** แล้ว · ยอดเงินใช้ฟิลด์
> `Orders.Total` (หรือ `Order Items.Line Total`) ถ้าตั้งไว้ตามหัวข้อ POS ·
> กรองวันที่ด้วยฟิลด์ `Order Date` (หรือ `Created` แบบ created-time) — แนะนำให้มี
> ฟิลด์ใดฟิลด์หนึ่ง ไม่งั้นจะรวมยอดใบขายที่ Done ทั้งหมด

---

## หมายเหตุ: เว็บแอป vs Airtable-native

โฟลเดอร์นี้เป็นแนวทาง **Airtable-native** ใช้ฟิลด์แบบ **Linked record**
ส่วนเว็บแอปเดิม (`src/`) ออกแบบให้เก็บความสัมพันธ์เป็น **text record id**
ทั้งสองแบบใช้ตรรกะ FIFO เดียวกัน แต่รูปแบบฟิลด์ต่างกัน

- ถ้าจะใช้ **Airtable-native อย่างเดียว** (ตามที่ตั้งใจตอนนี้): ทำตาม README นี้พอ
  ไม่ต้องรันเว็บแอป
- ถ้าอยากให้ **เว็บแอปอ่าน base เดียวกันด้วย**: บอกผมได้ ผมจะปรับตัวอ่าน
  Airtable ในเว็บแอปให้รองรับ Linked record (อ่านค่าจาก array ของ record id)
