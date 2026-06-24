# StockYa บน Airtable (Automation + Script)

ทำระบบสต๊อกยาให้ทำงาน **ในตัว Airtable เอง** — ผู้ใช้แค่สร้าง "ใบสั่งงาน"
(record ในตาราง **Movements**) แล้ว **Automation** จะตัดสต๊อกตามล็อต (FIFO) ให้
อัตโนมัติ ส่วนการแจ้งเตือนยาหมดอายุใช้ Automation แบบไม่ต้องเขียนสคริปต์

> ⚠️ Airtable ไม่มี API สำหรับสร้าง Automation — ต้องตั้งค่าเองในหน้าเว็บ Airtable
> โดยใช้สคริปต์ในโฟลเดอร์นี้ (คัดลอกไปวางในแอ็กชัน “Run a script”)

แนวคิด: **Movements = ใบสั่งงาน**, **Lots = สต๊อกจริง**, **Transactions = บัญชีแยกประเภท (เดินรายการ)**

```
ผู้ใช้สร้างแถวใน Movements (Type = Receive/Issue/Transfer, Status = New)
        │  (Automation trigger)
        ▼
   Run a script  →  อ่าน/แก้ Lots ตาม FIFO  →  สร้าง Transactions  →  ตั้ง Status = Done/Error + Result
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
| Created At | Created time |

### Movements  ← ใบสั่งงาน (ผู้ใช้กรอกที่นี่ / ผ่าน Form / Interface)
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

## 2) ตั้งค่า Automation (ทำ 3 ตัว)

ทำเหมือนกันทั้ง 3 ตัว ต่างกันแค่เงื่อนไข Type และไฟล์สคริปต์:

| Automation | เงื่อนไข Trigger | สคริปต์ |
|---|---|---|
| รับเข้า | Status = `New` และ Type = `Receive` | `01-receive.js` |
| เบิกออก | Status = `New` และ Type = `Issue` | `02-issue.js` |
| ย้ายคลัง | Status = `New` และ Type = `Transfer` | `03-transfer.js` |

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

## 4) ส่วนติดต่อผู้ใช้ (UI)

เลือกได้ตามสะดวก — ทุกทางเขียนลงตาราง Movements เหมือนกัน:

- **Airtable Form** — ทำฟอร์ม "เบิกยา/ย้ายคลัง/รับเข้า" จากตาราง Movements
  (ผู้ใช้ภายนอกกรอกได้ ไม่ต้องเข้าถึง base)
- **Airtable Interfaces** — ทำหน้า Dashboard + ปุ่มสร้าง record ดูสวยงาม
  ใช้ระบบล็อกอินของ Airtable เอง (ตอบโจทย์ "หน้าล็อกอิน")
- **เว็บแอป StockYa** (ในโปรเจกต์นี้) — ถ้ายังอยากใช้เว็บแอปคู่กัน ดูหมายเหตุด้านล่าง

---

## หมายเหตุ: เว็บแอป vs Airtable-native

โฟลเดอร์นี้เป็นแนวทาง **Airtable-native** ใช้ฟิลด์แบบ **Linked record**
ส่วนเว็บแอปเดิม (`src/`) ออกแบบให้เก็บความสัมพันธ์เป็น **text record id**
ทั้งสองแบบใช้ตรรกะ FIFO เดียวกัน แต่รูปแบบฟิลด์ต่างกัน

- ถ้าจะใช้ **Airtable-native อย่างเดียว** (ตามที่ตั้งใจตอนนี้): ทำตาม README นี้พอ
  ไม่ต้องรันเว็บแอป
- ถ้าอยากให้ **เว็บแอปอ่าน base เดียวกันด้วย**: บอกผมได้ ผมจะปรับตัวอ่าน
  Airtable ในเว็บแอปให้รองรับ Linked record (อ่านค่าจาก array ของ record id)
