import type { Drug, Lot, Transaction, User, Warehouse } from "@/lib/types";
import type { Store } from "./types";
import { buildSeed } from "./seed";

// ฐานข้อมูลตัวอย่างในหน่วยความจำ สำหรับโหมด Demo
// เก็บไว้บน globalThis เพื่อให้คงอยู่ข้ามการ reload ของ Next.js ใน dev
// หมายเหตุ: ข้อมูลจะหายเมื่อรีสตาร์ทเซิร์ฟเวอร์ — ใช้ Airtable สำหรับงานจริง

interface MemoryDB {
  users: User[];
  warehouses: Warehouse[];
  drugs: Drug[];
  lots: Lot[];
  transactions: Transaction[];
  seq: number;
}

const g = globalThis as unknown as { __stockyaDB?: MemoryDB };

function db(): MemoryDB {
  if (!g.__stockyaDB) {
    g.__stockyaDB = { ...buildSeed(), seq: 1000 };
  }
  return g.__stockyaDB;
}

const id = (prefix: string) => `${prefix}_${(db().seq++).toString(36)}`;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export class MemoryStore implements Store {
  async getUserByEmail(email: string) {
    return clone(db().users.find((u) => u.email === email) ?? null);
  }
  async listUsers() {
    return clone(db().users);
  }

  async listWarehouses() {
    return clone(db().warehouses);
  }
  async getWarehouse(wid: string) {
    return clone(db().warehouses.find((w) => w.id === wid) ?? null);
  }
  async createWarehouse(data: Omit<Warehouse, "id">) {
    const row: Warehouse = { id: id("wh"), ...data };
    db().warehouses.push(row);
    return clone(row);
  }

  async listDrugs() {
    return clone(db().drugs);
  }
  async getDrug(did: string) {
    return clone(db().drugs.find((d) => d.id === did) ?? null);
  }
  async createDrug(data: Omit<Drug, "id">) {
    const row: Drug = { id: id("drg"), ...data };
    db().drugs.push(row);
    return clone(row);
  }

  async listLots() {
    return clone(db().lots);
  }
  async getLot(lid: string) {
    return clone(db().lots.find((l) => l.id === lid) ?? null);
  }
  async createLot(data: Omit<Lot, "id">) {
    const row: Lot = { id: id("lot"), ...data };
    db().lots.push(row);
    return clone(row);
  }
  async updateLot(lid: string, patch: Partial<Omit<Lot, "id">>) {
    const row = db().lots.find((l) => l.id === lid);
    if (!row) throw new Error("ไม่พบ Lot");
    Object.assign(row, patch);
    return clone(row);
  }

  async listTransactions() {
    return clone(db().transactions);
  }
  async createTransaction(data: Omit<Transaction, "id">) {
    const row: Transaction = { id: id("txn"), ...data };
    db().transactions.push(row);
    return clone(row);
  }
}
