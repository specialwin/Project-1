// โครงสร้างข้อมูลหลักของระบบสต๊อกยา (StockYa)

export type Role = "admin" | "staff";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  note?: string;
}

export interface Drug {
  id: string;
  code: string;
  name: string;
  genericName?: string;
  /** หน่วยนับ เช่น เม็ด, ขวด, แผง */
  unit: string;
  category?: string;
  /** จุดสั่งซื้อ — เตือนเมื่อสต๊อกรวมต่ำกว่าค่านี้ */
  minQty: number;
  note?: string;
}

export interface Lot {
  id: string;
  drugId: string;
  warehouseId: string;
  lotNo: string;
  /** ISO date (YYYY-MM-DD) */
  expiryDate: string;
  quantity: number;
  /** ISO date (YYYY-MM-DD) */
  receivedDate: string;
  note?: string;
}

export type TxnType = "RECEIVE" | "ISSUE" | "TRANSFER" | "ADJUST";

export interface Transaction {
  id: string;
  type: TxnType;
  drugId: string;
  lotNo: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  quantity: number;
  note?: string;
  userEmail: string;
  /** ISO datetime */
  createdAt: string;
}

// ข้อมูลที่ประกอบร่างแล้ว (join) สำหรับแสดงผล
export interface LotWithRefs extends Lot {
  drug: Drug;
  warehouse: Warehouse;
}

export interface TransactionWithRefs extends Transaction {
  drug?: Drug;
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
}
