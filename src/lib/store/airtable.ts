import type { Drug, Lot, Transaction, User, Warehouse } from "@/lib/types";
import type { Store } from "./types";
import { airtableTables } from "@/lib/config";
import {
  createOne,
  getOne,
  listAll,
  updateOne,
  type AirtableRecord,
} from "./airtable-client";

// แปลงระเบียน Airtable <-> โครงสร้างข้อมูลในระบบ
// foreign key (DrugId/WarehouseId) เก็บเป็น text = record id ของ Airtable

const str = (v: unknown): string => (v == null ? "" : String(v));
const opt = (v: unknown): string | undefined => {
  const s = v == null ? "" : String(v);
  return s === "" ? undefined : s;
};
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function toUser(r: AirtableRecord): User {
  const f = r.fields;
  return {
    id: r.id,
    email: str(f.Email).toLowerCase(),
    name: str(f.Name) || str(f.Email),
    passwordHash: str(f.PasswordHash),
    role: str(f.Role) === "admin" ? "admin" : "staff",
  };
}

function toWarehouse(r: AirtableRecord): Warehouse {
  const f = r.fields;
  return {
    id: r.id,
    name: str(f.Name),
    code: str(f.Code),
    location: opt(f.Location),
    note: opt(f.Note),
  };
}

function toDrug(r: AirtableRecord): Drug {
  const f = r.fields;
  return {
    id: r.id,
    code: str(f.Code),
    name: str(f.Name),
    genericName: opt(f.GenericName),
    unit: str(f.Unit),
    category: opt(f.Category),
    minQty: num(f.MinQty),
    note: opt(f.Note),
  };
}

function toLot(r: AirtableRecord): Lot {
  const f = r.fields;
  return {
    id: r.id,
    drugId: str(f.DrugId),
    warehouseId: str(f.WarehouseId),
    lotNo: str(f.LotNo),
    expiryDate: str(f.ExpiryDate).slice(0, 10),
    quantity: num(f.Quantity),
    receivedDate: str(f.ReceivedDate).slice(0, 10),
    note: opt(f.Note),
  };
}

function toTxn(r: AirtableRecord): Transaction {
  const f = r.fields;
  const t = str(f.Type);
  return {
    id: r.id,
    type: (["RECEIVE", "ISSUE", "TRANSFER", "ADJUST"].includes(t)
      ? t
      : "ADJUST") as Transaction["type"],
    drugId: str(f.DrugId),
    lotNo: str(f.LotNo),
    fromWarehouseId: opt(f.FromWarehouseId),
    toWarehouseId: opt(f.ToWarehouseId),
    quantity: num(f.Quantity),
    note: opt(f.Note),
    userEmail: str(f.UserEmail),
    createdAt: str(f.CreatedAt) || r.createdTime,
  };
}

export class AirtableStore implements Store {
  async getUserByEmail(email: string) {
    const all = await listAll(airtableTables.users);
    const found = all
      .map(toUser)
      .find((u) => u.email === email.toLowerCase());
    return found ?? null;
  }
  async listUsers() {
    return (await listAll(airtableTables.users)).map(toUser);
  }

  async listWarehouses() {
    return (await listAll(airtableTables.warehouses)).map(toWarehouse);
  }
  async getWarehouse(id: string) {
    const r = await getOne(airtableTables.warehouses, id);
    return r ? toWarehouse(r) : null;
  }
  async createWarehouse(data: Omit<Warehouse, "id">) {
    const r = await createOne(airtableTables.warehouses, {
      Name: data.name,
      Code: data.code,
      Location: data.location,
      Note: data.note,
    });
    return toWarehouse(r);
  }

  async listDrugs() {
    return (await listAll(airtableTables.drugs)).map(toDrug);
  }
  async getDrug(id: string) {
    const r = await getOne(airtableTables.drugs, id);
    return r ? toDrug(r) : null;
  }
  async createDrug(data: Omit<Drug, "id">) {
    const r = await createOne(airtableTables.drugs, {
      Code: data.code,
      Name: data.name,
      GenericName: data.genericName,
      Unit: data.unit,
      Category: data.category,
      MinQty: data.minQty,
      Note: data.note,
    });
    return toDrug(r);
  }

  async listLots() {
    return (await listAll(airtableTables.lots)).map(toLot);
  }
  async getLot(id: string) {
    const r = await getOne(airtableTables.lots, id);
    return r ? toLot(r) : null;
  }
  async createLot(data: Omit<Lot, "id">) {
    const r = await createOne(airtableTables.lots, {
      DrugId: data.drugId,
      WarehouseId: data.warehouseId,
      LotNo: data.lotNo,
      ExpiryDate: data.expiryDate,
      Quantity: data.quantity,
      ReceivedDate: data.receivedDate,
      Note: data.note,
    });
    return toLot(r);
  }
  async updateLot(id: string, patch: Partial<Omit<Lot, "id">>) {
    const fields: Record<string, unknown> = {};
    if (patch.quantity != null) fields.Quantity = patch.quantity;
    if (patch.note != null) fields.Note = patch.note;
    if (patch.expiryDate != null) fields.ExpiryDate = patch.expiryDate;
    const r = await updateOne(airtableTables.lots, id, fields);
    return toLot(r);
  }

  async listTransactions() {
    return (await listAll(airtableTables.transactions)).map(toTxn);
  }
  async createTransaction(data: Omit<Transaction, "id">) {
    const r = await createOne(airtableTables.transactions, {
      Type: data.type,
      DrugId: data.drugId,
      LotNo: data.lotNo,
      FromWarehouseId: data.fromWarehouseId,
      ToWarehouseId: data.toWarehouseId,
      Quantity: data.quantity,
      Note: data.note,
      UserEmail: data.userEmail,
      CreatedAt: data.createdAt,
    });
    return toTxn(r);
  }
}
