"use client";
import { addWarehouseAction } from "@/app/(app)/actions";
import { Input } from "@/components/ui/input";
import { ActionForm } from "./action-form";
import { Field } from "./field";

export function WarehouseForm() {
  return (
    <ActionForm action={addWarehouseAction} submitLabel="เพิ่มคลัง">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="ชื่อคลัง" htmlFor="name">
          <Input id="name" name="name" required placeholder="เช่น ห้องจ่ายยา ER" />
        </Field>
        <Field label="รหัสคลัง" htmlFor="code">
          <Input id="code" name="code" required placeholder="ER" />
        </Field>
      </div>
      <Field label="ที่ตั้ง" htmlFor="location">
        <Input id="location" name="location" placeholder="อาคาร / ชั้น" />
      </Field>
    </ActionForm>
  );
}
