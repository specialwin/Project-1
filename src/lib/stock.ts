import { getStore } from "./store";
import { daysUntil, expiryStatus, type ExpiryStatus } from "./expiry";
import type {
  Drug,
  Lot,
  LotWithRefs,
  Transaction,
  TransactionWithRefs,
  Warehouse,
} from "./types";

const todayIso = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// อ่านข้อมูลแบบ join
// ---------------------------------------------------------------------------

export async function getRefMaps() {
  const store = getStore();
  const [drugs, warehouses] = await Promise.all([
    store.listDrugs(),
    store.listWarehouses(),
  ]);
  return {
    drugs,
    warehouses,
    drugMap: new Map(drugs.map((d) => [d.id, d])),
    warehouseMap: new Map(warehouses.map((w) => [w.id, w])),
  };
}

export async function listLotsWithRefs(): Promise<LotWithRefs[]> {
  const store = getStore();
  const [lots, { drugMap, warehouseMap }] = await Promise.all([
    store.listLots(),
    getRefMaps(),
  ]);
  return lots
    .map((lot) => {
      const drug = drugMap.get(lot.drugId);
      const warehouse = warehouseMap.get(lot.warehouseId);
      if (!drug || !warehouse) return null;
      return { ...lot, drug, warehouse };
    })
    .filter((x): x is LotWithRefs => x !== null);
}

// ---------------------------------------------------------------------------
// FIFO / FEFO — เลือก lot ที่หมดอายุก่อนออกก่อน
// ---------------------------------------------------------------------------

export interface Allocation {
  lot: Lot;
  take: number;
}

export interface AllocationResult {
  allocations: Allocation[];
  available: number;
  requested: number;
  shortBy: number;
  ok: boolean;
}

/**
 * จัดสรรจำนวนที่ต้องเบิกตามหลัก FIFO/FEFO
 * (เรียงตามวันหมดอายุก่อน แล้วตามวันรับเข้า) โดยข้าม lot ที่หมดอายุแล้ว
 */
export function allocateFifo(
  lots: Lot[],
  drugId: string,
  warehouseId: string,
  requested: number,
): AllocationResult {
  const candidates = lots
    .filter(
      (l) =>
        l.drugId === drugId &&
        l.warehouseId === warehouseId &&
        l.quantity > 0 &&
        daysUntil(l.expiryDate) >= 0,
    )
    .sort(
      (a, b) =>
        a.expiryDate.localeCompare(b.expiryDate) ||
        a.receivedDate.localeCompare(b.receivedDate),
    );

  const available = candidates.reduce((s, l) => s + l.quantity, 0);
  const allocations: Allocation[] = [];
  let remaining = requested;
  for (const lot of candidates) {
    if (remaining <= 0) break;
    const take = Math.min(lot.quantity, remaining);
    allocations.push({ lot, take });
    remaining -= take;
  }
  const shortBy = Math.max(0, remaining);
  return {
    allocations,
    available,
    requested,
    shortBy,
    ok: shortBy === 0 && requested > 0,
  };
}

// ---------------------------------------------------------------------------
// รับเข้า (RECEIVE)
// ---------------------------------------------------------------------------

export interface ReceiveInput {
  drugId: string;
  warehouseId: string;
  lotNo: string;
  expiryDate: string;
  quantity: number;
  note?: string;
  userEmail: string;
}

export async function receiveStock(input: ReceiveInput) {
  const store = getStore();
  if (input.quantity <= 0) throw new Error("จำนวนต้องมากกว่า 0");

  // ถ้ามี lot เดียวกัน (ยา + คลัง + เลข lot + วันหมดอายุ) อยู่แล้ว ให้รวมจำนวน
  const lots = await store.listLots();
  const existing = lots.find(
    (l) =>
      l.drugId === input.drugId &&
      l.warehouseId === input.warehouseId &&
      l.lotNo === input.lotNo &&
      l.expiryDate === input.expiryDate,
  );

  if (existing) {
    await store.updateLot(existing.id, {
      quantity: existing.quantity + input.quantity,
    });
  } else {
    await store.createLot({
      drugId: input.drugId,
      warehouseId: input.warehouseId,
      lotNo: input.lotNo,
      expiryDate: input.expiryDate,
      quantity: input.quantity,
      receivedDate: todayIso(),
      note: input.note,
    });
  }

  await store.createTransaction({
    type: "RECEIVE",
    drugId: input.drugId,
    lotNo: input.lotNo,
    toWarehouseId: input.warehouseId,
    quantity: input.quantity,
    note: input.note,
    userEmail: input.userEmail,
    createdAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// เบิกออก (ISSUE) — ตาม FIFO
// ---------------------------------------------------------------------------

export interface IssueInput {
  drugId: string;
  warehouseId: string;
  quantity: number;
  /** ระบุล็อตเอง (override FIFO) — เว้นว่างไว้ = ตัดอัตโนมัติตาม FIFO */
  lotId?: string;
  note?: string;
  userEmail: string;
}

export async function issueStock(input: IssueInput) {
  const store = getStore();
  if (input.quantity <= 0) throw new Error("จำนวนต้องมากกว่า 0");

  const lots = await store.listLots();

  let plan: AllocationResult;
  if (input.lotId) {
    // เลือกล็อตเอง — ตัดเฉพาะล็อตที่ระบุ
    const lot = lots.find((l) => l.id === input.lotId);
    if (!lot || lot.drugId !== input.drugId || lot.warehouseId !== input.warehouseId)
      throw new Error("ไม่พบล็อตที่เลือกในคลังนี้");
    if (daysUntil(lot.expiryDate) < 0)
      throw new Error(`ล็อต ${lot.lotNo} หมดอายุแล้ว ไม่สามารถเบิกได้`);
    if (lot.quantity < input.quantity)
      throw new Error(
        `ล็อต ${lot.lotNo} มีคงเหลือ ${lot.quantity} แต่ต้องการ ${input.quantity}`,
      );
    plan = {
      allocations: [{ lot, take: input.quantity }],
      available: lot.quantity,
      requested: input.quantity,
      shortBy: 0,
      ok: true,
    };
  } else {
    // อัตโนมัติตาม FIFO
    plan = allocateFifo(lots, input.drugId, input.warehouseId, input.quantity);
    if (!plan.ok) {
      throw new Error(
        `สต๊อกไม่พอ ต้องการ ${input.quantity} แต่มีให้เบิกได้ ${plan.available} (ขาดอีก ${plan.shortBy})`,
      );
    }
  }

  for (const { lot, take } of plan.allocations) {
    await store.updateLot(lot.id, { quantity: lot.quantity - take });
    await store.createTransaction({
      type: "ISSUE",
      drugId: input.drugId,
      lotNo: lot.lotNo,
      fromWarehouseId: input.warehouseId,
      quantity: take,
      note: input.note,
      userEmail: input.userEmail,
      createdAt: new Date().toISOString(),
    });
  }
  return plan;
}

// ---------------------------------------------------------------------------
// ย้ายคลัง (TRANSFER) — ตัดจากคลังต้นทางตาม FIFO แล้วไปเพิ่มที่ปลายทาง
// ---------------------------------------------------------------------------

export interface TransferInput {
  drugId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  note?: string;
  userEmail: string;
}

export async function transferStock(input: TransferInput) {
  const store = getStore();
  if (input.quantity <= 0) throw new Error("จำนวนต้องมากกว่า 0");
  if (input.fromWarehouseId === input.toWarehouseId)
    throw new Error("คลังต้นทางและปลายทางต้องไม่ใช่คลังเดียวกัน");

  let lots = await store.listLots();
  const plan = allocateFifo(
    lots,
    input.drugId,
    input.fromWarehouseId,
    input.quantity,
  );
  if (!plan.ok) {
    throw new Error(
      `สต๊อกไม่พอ ต้องการ ${input.quantity} แต่คลังต้นทางมีให้ย้ายได้ ${plan.available} (ขาดอีก ${plan.shortBy})`,
    );
  }

  for (const { lot, take } of plan.allocations) {
    // ตัดจากต้นทาง
    await store.updateLot(lot.id, { quantity: lot.quantity - take });

    // เพิ่มที่ปลายทาง — รวมกับ lot เดิมที่ตรงกันถ้ามี
    lots = await store.listLots();
    const destLot = lots.find(
      (l) =>
        l.drugId === input.drugId &&
        l.warehouseId === input.toWarehouseId &&
        l.lotNo === lot.lotNo &&
        l.expiryDate === lot.expiryDate,
    );
    if (destLot) {
      await store.updateLot(destLot.id, { quantity: destLot.quantity + take });
    } else {
      await store.createLot({
        drugId: input.drugId,
        warehouseId: input.toWarehouseId,
        lotNo: lot.lotNo,
        expiryDate: lot.expiryDate,
        quantity: take,
        receivedDate: todayIso(),
        note: input.note,
      });
    }

    await store.createTransaction({
      type: "TRANSFER",
      drugId: input.drugId,
      lotNo: lot.lotNo,
      fromWarehouseId: input.fromWarehouseId,
      toWarehouseId: input.toWarehouseId,
      quantity: take,
      note: input.note,
      userEmail: input.userEmail,
      createdAt: new Date().toISOString(),
    });
  }
  return plan;
}

// ---------------------------------------------------------------------------
// แจ้งเตือนยาหมดอายุ
// ---------------------------------------------------------------------------

export interface ExpiringLot extends LotWithRefs {
  status: ExpiryStatus;
  daysLeft: number;
}

export async function getExpiringLots(
  includeOk = false,
): Promise<ExpiringLot[]> {
  const lots = await listLotsWithRefs();
  return lots
    .filter((l) => l.quantity > 0)
    .map((l) => ({
      ...l,
      status: expiryStatus(l.expiryDate),
      daysLeft: daysUntil(l.expiryDate),
    }))
    .filter((l) => includeOk || l.status !== "ok")
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * แผนที่จำนวนที่ "เบิก/ย้ายได้" (ไม่นับ lot ที่หมดอายุ)
 * key = `${drugId}::${warehouseId}`
 */
export async function getAvailabilityMap(): Promise<Record<string, number>> {
  const lots = await getStore().listLots();
  const map: Record<string, number> = {};
  for (const l of lots) {
    if (l.quantity <= 0 || daysUntil(l.expiryDate) < 0) continue;
    const key = `${l.drugId}::${l.warehouseId}`;
    map[key] = (map[key] ?? 0) + l.quantity;
  }
  return map;
}

export interface IssuableLot {
  id: string;
  lotNo: string;
  expiryDate: string;
  quantity: number;
  daysLeft: number;
}

/**
 * รายการล็อตที่เบิกได้ (ไม่หมดอายุ, คงเหลือ > 0) เรียงตาม FIFO
 * สำหรับให้ผู้ใช้เลือกล็อตเองในฟอร์ม — key = `${drugId}::${warehouseId}`
 */
export async function getIssuableLotsMap(): Promise<
  Record<string, IssuableLot[]>
> {
  const lots = await getStore().listLots();
  const map: Record<string, IssuableLot[]> = {};
  for (const l of lots) {
    const daysLeft = daysUntil(l.expiryDate);
    if (l.quantity <= 0 || daysLeft < 0) continue;
    const key = `${l.drugId}::${l.warehouseId}`;
    (map[key] ??= []).push({
      id: l.id,
      lotNo: l.lotNo,
      expiryDate: l.expiryDate,
      quantity: l.quantity,
      daysLeft,
    });
  }
  for (const key of Object.keys(map)) {
    map[key].sort(
      (a, b) =>
        a.expiryDate.localeCompare(b.expiryDate) || b.quantity - a.quantity,
    );
  }
  return map;
}

// ---------------------------------------------------------------------------
// สรุปสต๊อกรายยา
// ---------------------------------------------------------------------------

export interface DrugStock {
  drug: Drug;
  total: number;
  byWarehouse: { warehouse: Warehouse; quantity: number }[];
  lots: number;
  belowMin: boolean;
}

export async function getDrugStockSummary(): Promise<DrugStock[]> {
  const store = getStore();
  const [lots, { drugs, warehouses }] = await Promise.all([
    store.listLots(),
    getRefMaps(),
  ]);

  return drugs.map((drug) => {
    const drugLots = lots.filter((l) => l.drugId === drug.id);
    const total = drugLots.reduce((s, l) => s + l.quantity, 0);
    const byWarehouse = warehouses
      .map((w) => ({
        warehouse: w,
        quantity: drugLots
          .filter((l) => l.warehouseId === w.id)
          .reduce((s, l) => s + l.quantity, 0),
      }))
      .filter((x) => x.quantity > 0);
    return {
      drug,
      total,
      byWarehouse,
      lots: drugLots.filter((l) => l.quantity > 0).length,
      belowMin: total < drug.minQty,
    };
  });
}

// ---------------------------------------------------------------------------
// ประวัติการเคลื่อนไหว
// ---------------------------------------------------------------------------

export async function listTransactionsWithRefs(
  limit = 100,
): Promise<TransactionWithRefs[]> {
  const store = getStore();
  const [txns, { drugMap, warehouseMap }] = await Promise.all([
    store.listTransactions(),
    getRefMaps(),
  ]);
  return txns
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((t) => ({
      ...t,
      drug: drugMap.get(t.drugId),
      fromWarehouse: t.fromWarehouseId
        ? warehouseMap.get(t.fromWarehouseId)
        : undefined,
      toWarehouse: t.toWarehouseId
        ? warehouseMap.get(t.toWarehouseId)
        : undefined,
    }));
}
