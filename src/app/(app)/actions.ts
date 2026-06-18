"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserOrRedirect } from "@/lib/session";
import { getStore } from "@/lib/store";
import {
  issueStock,
  receiveStock,
  transferStock,
} from "@/lib/stock";

export interface ActionResult {
  ok: boolean;
  message: string;
}

function fail(message: string): ActionResult {
  return { ok: false, message };
}
function done(message: string): ActionResult {
  return { ok: true, message };
}

function revalidateAll() {
  for (const p of [
    "/",
    "/stock",
    "/receive",
    "/issue",
    "/transfer",
    "/alerts",
    "/drugs",
    "/history",
  ]) {
    revalidatePath(p);
  }
}

const num = z.coerce.number();

// ---------------------------------------------------------------------------
// รับเข้า
// ---------------------------------------------------------------------------
const receiveSchema = z.object({
  drugId: z.string().min(1, "เลือกยา"),
  warehouseId: z.string().min(1, "เลือกคลัง"),
  lotNo: z.string().min(1, "กรอกเลข Lot"),
  expiryDate: z.string().min(1, "กรอกวันหมดอายุ"),
  quantity: num.int().positive("จำนวนต้องมากกว่า 0"),
  note: z.string().optional(),
});

export async function receiveAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getUserOrRedirect();
  const parsed = receiveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    await receiveStock({ ...parsed.data, userEmail: user.email ?? "" });
    revalidateAll();
    return done("บันทึกรับยาเข้าสต๊อกแล้ว");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
  }
}

// ---------------------------------------------------------------------------
// เบิกออก (FIFO)
// ---------------------------------------------------------------------------
const issueSchema = z.object({
  drugId: z.string().min(1, "เลือกยา"),
  warehouseId: z.string().min(1, "เลือกคลัง"),
  quantity: num.int().positive("จำนวนต้องมากกว่า 0"),
  note: z.string().optional(),
});

export async function issueAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getUserOrRedirect();
  const parsed = issueSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    const plan = await issueStock({
      ...parsed.data,
      userEmail: user.email ?? "",
    });
    revalidateAll();
    const lots = plan.allocations
      .map((a) => `${a.lot.lotNo} (${a.take})`)
      .join(", ");
    return done(`เบิกออกแล้ว ${parsed.data.quantity} หน่วย จาก Lot: ${lots}`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
  }
}

// ---------------------------------------------------------------------------
// ย้ายคลัง (FIFO)
// ---------------------------------------------------------------------------
const transferSchema = z.object({
  drugId: z.string().min(1, "เลือกยา"),
  fromWarehouseId: z.string().min(1, "เลือกคลังต้นทาง"),
  toWarehouseId: z.string().min(1, "เลือกคลังปลายทาง"),
  quantity: num.int().positive("จำนวนต้องมากกว่า 0"),
  note: z.string().optional(),
});

export async function transferAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getUserOrRedirect();
  const parsed = transferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    const plan = await transferStock({
      ...parsed.data,
      userEmail: user.email ?? "",
    });
    revalidateAll();
    const lots = plan.allocations
      .map((a) => `${a.lot.lotNo} (${a.take})`)
      .join(", ");
    return done(`ย้ายคลังแล้ว ${parsed.data.quantity} หน่วย จาก Lot: ${lots}`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
  }
}

// ---------------------------------------------------------------------------
// เพิ่มรายการยา
// ---------------------------------------------------------------------------
const drugSchema = z.object({
  code: z.string().min(1, "กรอกรหัสยา"),
  name: z.string().min(1, "กรอกชื่อยา"),
  genericName: z.string().optional(),
  unit: z.string().min(1, "กรอกหน่วยนับ"),
  category: z.string().optional(),
  minQty: num.int().nonnegative().default(0),
  note: z.string().optional(),
});

export async function addDrugAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await getUserOrRedirect();
  const parsed = drugSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    await getStore().createDrug(parsed.data);
    revalidateAll();
    return done(`เพิ่มยา “${parsed.data.name}” แล้ว`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
  }
}

// ---------------------------------------------------------------------------
// เพิ่มคลัง
// ---------------------------------------------------------------------------
const warehouseSchema = z.object({
  name: z.string().min(1, "กรอกชื่อคลัง"),
  code: z.string().min(1, "กรอกรหัสคลัง"),
  location: z.string().optional(),
  note: z.string().optional(),
});

export async function addWarehouseAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await getUserOrRedirect();
  const parsed = warehouseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    await getStore().createWarehouse(parsed.data);
    revalidateAll();
    return done(`เพิ่มคลัง “${parsed.data.name}” แล้ว`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
  }
}
