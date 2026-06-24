"use client";
import { receiveAction } from "@/app/(app)/actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Drug, Warehouse } from "@/lib/types";
import { ActionForm } from "./action-form";
import { Field } from "./field";

export function ReceiveForm({
  drugs,
  warehouses,
}: {
  drugs: Drug[];
  warehouses: Warehouse[];
}) {
  return (
    <ActionForm action={receiveAction} submitLabel="บันทึกรับเข้า">
      <Field label="ยา" htmlFor="drugId">
        <Select id="drugId" name="drugId" required defaultValue="">
          <option value="" disabled>
            — เลือกยา —
          </option>
          {drugs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </Select>
      </Field>

      <Field label="คลังที่รับเข้า" htmlFor="warehouseId">
        <Select id="warehouseId" name="warehouseId" required defaultValue="">
          <option value="" disabled>
            — เลือกคลัง —
          </option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="เลข Lot" htmlFor="lotNo">
          <Input id="lotNo" name="lotNo" required placeholder="เช่น PA2402" />
        </Field>
        <Field label="วันหมดอายุ" htmlFor="expiryDate">
          <Input id="expiryDate" name="expiryDate" type="date" required />
        </Field>
        <Field label="จำนวน" htmlFor="quantity">
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            required
            inputMode="numeric"
          />
        </Field>
      </div>

      <Field label="หมายเหตุ" htmlFor="note">
        <Textarea id="note" name="note" rows={2} placeholder="เช่น เลขใบส่งของ ผู้จำหน่าย" />
      </Field>
    </ActionForm>
  );
}
