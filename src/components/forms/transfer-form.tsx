"use client";
import { useState } from "react";
import { transferAction } from "@/app/(app)/actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Drug, Warehouse } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { ActionForm } from "./action-form";
import { Field } from "./field";

export function TransferForm({
  drugs,
  warehouses,
  available,
}: {
  drugs: Drug[];
  warehouses: Warehouse[];
  available: Record<string, number>;
}) {
  const [drugId, setDrugId] = useState("");
  const [fromId, setFromId] = useState("");
  const avail = available[`${drugId}::${fromId}`] ?? 0;
  const drug = drugs.find((d) => d.id === drugId);

  return (
    <ActionForm action={transferAction} submitLabel="ย้ายคลัง (FIFO)">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="คลังต้นทาง"
          htmlFor="fromWarehouseId"
          hint={
            drugId && fromId
              ? `ย้ายได้ ${formatNumber(avail)} ${drug?.unit ?? ""}`
              : undefined
          }
        >
          <Select
            id="fromWarehouseId"
            name="fromWarehouseId"
            required
            defaultValue=""
            onChange={(e) => setFromId(e.target.value)}
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

        <Field label="คลังปลายทาง" htmlFor="toWarehouseId">
          <Select id="toWarehouseId" name="toWarehouseId" required defaultValue="">
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
      </div>

      <Field label="จำนวนที่ย้าย" htmlFor="quantity">
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
        <Textarea id="note" name="note" rows={2} placeholder="เหตุผลการย้ายคลัง" />
      </Field>
    </ActionForm>
  );
}
