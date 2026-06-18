import type {
  Drug,
  Lot,
  Transaction,
  User,
  Warehouse,
} from "@/lib/types";

// สัญญา (interface) ของชั้นข้อมูล — มี 2 backend: Airtable และ In-memory (demo)
// ชั้นนี้ทำหน้าที่ CRUD ล้วน ๆ ส่วน logic ธุรกิจ (FIFO ฯลฯ) อยู่ที่ service
export interface Store {
  // ผู้ใช้
  getUserByEmail(email: string): Promise<User | null>;
  listUsers(): Promise<User[]>;

  // คลัง
  listWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: string): Promise<Warehouse | null>;
  createWarehouse(data: Omit<Warehouse, "id">): Promise<Warehouse>;

  // ยา
  listDrugs(): Promise<Drug[]>;
  getDrug(id: string): Promise<Drug | null>;
  createDrug(data: Omit<Drug, "id">): Promise<Drug>;

  // Lot
  listLots(): Promise<Lot[]>;
  getLot(id: string): Promise<Lot | null>;
  createLot(data: Omit<Lot, "id">): Promise<Lot>;
  updateLot(id: string, patch: Partial<Omit<Lot, "id">>): Promise<Lot>;

  // ประวัติการเคลื่อนไหว
  listTransactions(): Promise<Transaction[]>;
  createTransaction(data: Omit<Transaction, "id">): Promise<Transaction>;
}
