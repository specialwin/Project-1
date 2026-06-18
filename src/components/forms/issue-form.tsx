"use client";
import { useState } from "react";
import { issueAction } from "@/app/(app)/actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Drug, Warehouse } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { ActionForm } from "./action-form";
import { Field } from "./field";

export function IssueForm({
  drugs,
  warehouses,
  available,
}: {
  drugs: Drug[];
  warehouses: Warehouse[];
  /** จำนวนที่เบิกได้ (ไม่นับ lot หมดอายุ) keyed `${drugId}::${warehouseId}` */
  available: Record<string, number>;
}) {
  const [drugId, setDrugId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const avail = available[`${drugId}::${warehouseId}`] ?? 0;
  const drug = drugs.find((d) => d.id === drugId);

  return (
    <ActionForm action={issueAction} submitLabel="เบิกออก (FIFO)">
      <Field label="ยา" htmlFor="drugId">
        <Select
          id="drugId"
          name="drugId"
          required
          defaultValue=""
          onChange={(e) => setDrugId(e.target.value)}
        >
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

      <Field
        label="คลังที่เบิก"
        htmlFor="warehouseId"
        hint={
          drugId && warehouseId
            ? `เบิกได้ ${formatNumber(avail)} ${drug?.unit ?? ""} (ระบบจะตัด Lot ที่หมดอายุก่อนออกก่อน)`
            : "ระบบจะเลือก Lot ตามหลัก FIFO ให้อัตโนมัติ"
        }
      >
        <Select
          id="warehouseId"
          name="warehouseId"
          required
          defaultValue=""
          onChange={(e) => setWarehouseId(e.target.value)}
        >
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

      <Field label="จำนวนที่เบิก" htmlFor="quantity">
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={avail || undefined}
          required
          inputMode="numeric"
        />
      </Field>

      <Field label="หมายเหตุ" htmlFor="note">
        <Textarea
          id="note"
          name="note"
          rows={2}
          placeholder="เช่น เบิกให้แผนก OPD / ผู้ป่วยใน"
        />
      </Field>
    </ActionForm>
  );
}
