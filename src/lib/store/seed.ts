import bcrypt from "bcryptjs";
import type { Drug, Lot, Transaction, User, Warehouse } from "@/lib/types";

// ข้อมูลตัวอย่างสำหรับโหมด Demo (ใช้เมื่อยังไม่ได้ตั้งค่า Airtable)
// รหัสผ่านเริ่มต้นของทุกบัญชีคือ 1234

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const hash = (pw: string) => bcrypt.hashSync(pw, 8);

export function buildSeed() {
  const users: User[] = [
    {
      id: "usr_admin",
      email: "admin@stockya.local",
      name: "ผู้ดูแลระบบ",
      passwordHash: hash("1234"),
      role: "admin",
    },
    {
      id: "usr_staff",
      email: "staff@stockya.local",
      name: "เภสัชกร",
      passwordHash: hash("1234"),
      role: "staff",
    },
  ];

  const warehouses: Warehouse[] = [
    { id: "wh_main", name: "คลังกลาง", code: "MAIN", location: "อาคาร A ชั้น 1" },
    { id: "wh_opd", name: "ห้องจ่ายยา OPD", code: "OPD", location: "อาคาร B ชั้น 1" },
    { id: "wh_ipd", name: "ห้องจ่ายยา IPD", code: "IPD", location: "อาคาร C ชั้น 3" },
  ];

  const drugs: Drug[] = [
    {
      id: "drg_para",
      code: "MED-001",
      name: "Paracetamol 500 mg",
      genericName: "Paracetamol",
      unit: "เม็ด",
      category: "ยาแก้ปวด/ลดไข้",
      minQty: 500,
    },
    {
      id: "drg_amox",
      code: "MED-002",
      name: "Amoxicillin 500 mg",
      genericName: "Amoxicillin",
      unit: "แคปซูล",
      category: "ยาปฏิชีวนะ",
      minQty: 300,
    },
    {
      id: "drg_ome",
      code: "MED-003",
      name: "Omeprazole 20 mg",
      genericName: "Omeprazole",
      unit: "แคปซูล",
      category: "ยาลดกรด",
      minQty: 200,
    },
    {
      id: "drg_nss",
      code: "MED-004",
      name: "0.9% NSS 1000 ml",
      genericName: "Sodium Chloride",
      unit: "ขวด",
      category: "สารน้ำ",
      minQty: 50,
    },
  ];

  const lots: Lot[] = [
    // Paracetamol — หลาย lot ใน MAIN เพื่อโชว์ FIFO
    { id: "lot_1", drugId: "drg_para", warehouseId: "wh_main", lotNo: "PA2401", expiryDate: isoDaysFromNow(20), quantity: 400, receivedDate: isoDaysFromNow(-300) },
    { id: "lot_2", drugId: "drg_para", warehouseId: "wh_main", lotNo: "PA2402", expiryDate: isoDaysFromNow(200), quantity: 1000, receivedDate: isoDaysFromNow(-120) },
    { id: "lot_3", drugId: "drg_para", warehouseId: "wh_opd", lotNo: "PA2401", expiryDate: isoDaysFromNow(20), quantity: 150, receivedDate: isoDaysFromNow(-90) },
    // Amoxicillin — มี lot ใกล้หมดอายุ และหมดอายุแล้ว
    { id: "lot_4", drugId: "drg_amox", warehouseId: "wh_main", lotNo: "AM2310", expiryDate: isoDaysFromNow(-5), quantity: 80, receivedDate: isoDaysFromNow(-400) },
    { id: "lot_5", drugId: "drg_amox", warehouseId: "wh_main", lotNo: "AM2401", expiryDate: isoDaysFromNow(75), quantity: 250, receivedDate: isoDaysFromNow(-60) },
    // Omeprazole
    { id: "lot_6", drugId: "drg_ome", warehouseId: "wh_main", lotNo: "OM2402", expiryDate: isoDaysFromNow(150), quantity: 120, receivedDate: isoDaysFromNow(-40) },
    // NSS
    { id: "lot_7", drugId: "drg_nss", warehouseId: "wh_ipd", lotNo: "NS2403", expiryDate: isoDaysFromNow(365), quantity: 60, receivedDate: isoDaysFromNow(-20) },
  ];

  const transactions: Transaction[] = [];

  return { users, warehouses, drugs, lots, transactions };
}
