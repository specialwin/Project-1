"use client";
import { useState } from "react";
import { issueAction } from "@/app/(app)/actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Drug, Warehouse } from "@/lib/types";
import type { IssuableLot } from "@/lib/stock";
import { formatDate, formatNumber } from "@/lib/format";
import { ActionForm } from "./action-form";
import { Field } from "./field";

export function IssueForm({
  drugs,
  warehouses,
  available,
  lotsByKey,
}: {
  drugs: Drug[];
  warehouses: Warehouse[];
  /** จำนวนที่เบิกได้ (ไม่นับ lot หมดอายุ) keyed `${drugId}::${warehouseId}` */
  available: Record<string, number>;
  /** ล็อตที่เบิกได้ต่อ ยา+คลัง keyed `${drugId}::${warehouseId}` */
  lotsByKey: Record<string, IssuableLot[]>;
}) {
  const [drugId, setDrugId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [lotId, setLotId] = useState("");
  const key = `${drugId}::${warehouseId}`;
  const avail = available[key] ?? 0;
  const lots = lotsByKey[key] ?? [];
  const drug = drugs.find((d) => d.id === drugId);

  // จำนวนสูงสุดที่กรอกได้: ถ้าเลือกล็อตเอง = คงเหลือในล็อตนั้น, ไม่งั้น = รวมทั้งคลัง
  const selectedLot = lots.find((l) => l.id === lotId);
  const maxQty = selectedLot ? selectedLot.quantity : avail;

  // ถ้าเปลี่ยนยา/คลัง ให้รีเซ็ตล็อตที่เลือก
  function onDrugOrWh(next: { drug?: string; wh?: string }) {
    if (next.drug !== undefined) setDrugId(next.drug);
    if (next.wh !== undefined) setWarehouseId(next.wh);
    setLotId("");
  }

  return (
    <ActionForm action={issueAction} submitLabel="เบิกออก">
      <Field label="ยา" htmlFor="drugId">
        <Select
          id="drugId"
          name="drugId"
          required
          defaultValue=""
          onChange={(e) => onDrugOrWh({ drug: e.target.value })}
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
            ? `เบิกได้รวม ${formatNumber(avail)} ${drug?.unit ?? ""}`
            : undefined
        }
      >
        <Select
          id="warehouseId"
          name="warehouseId"
          required
          defaultValue=""
          onChange={(e) => onDrugOrWh({ wh: e.target.value })}
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

      {/* เลือกล็อต — ค่าเริ่มต้นเป็นอัตโนมัติ (FIFO) */}
      <Field
        label="ล็อตที่เบิก"
        htmlFor="lotId"
        hint={
          lotId
            ? "ตัดเฉพาะล็อตที่เลือก"
            : "อัตโนมัติ — ระบบเลือกล็อตที่หมดอายุก่อนออกก่อน (FIFO)"
        }
      >
        <Select
          id="lotId"
          name="lotId"
          value={lotId}
          onChange={(e) => setLotId(e.target.value)}
          disabled={!drugId || !warehouseId}
        >
          <option value="">อัตโนมัติ (FIFO)</option>
          {lots.map((l) => (
            <option key={l.id} value={l.id}>
              {l.lotNo} · EXP {formatDate(l.expiryDate)} · คงเหลือ{" "}
              {formatNumber(l.quantity)}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="จำนวนที่เบิก"
        htmlFor="quantity"
        hint={
          selectedLot
            ? `สูงสุด ${formatNumber(maxQty)} ${drug?.unit ?? ""} ในล็อตนี้`
            : undefined
        }
      >
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={maxQty || undefined}
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
