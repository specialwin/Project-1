"use client";
import { addDrugAction } from "@/app/(app)/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActionForm } from "./action-form";
import { Field } from "./field";

export function DrugForm() {
  return (
    <ActionForm action={addDrugAction} submitLabel="เพิ่มยา">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="รหัสยา" htmlFor="code">
          <Input id="code" name="code" required placeholder="MED-005" />
        </Field>
        <Field label="หน่วยนับ" htmlFor="unit">
          <Input id="unit" name="unit" required placeholder="เม็ด / ขวด / แผง" />
        </Field>
      </div>
      <Field label="ชื่อยา" htmlFor="name">
        <Input id="name" name="name" required placeholder="ชื่อการค้า + ความแรง" />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="ชื่อสามัญ (Generic)" htmlFor="genericName">
          <Input id="genericName" name="genericName" />
        </Field>
        <Field label="หมวดหมู่" htmlFor="category">
          <Input id="category" name="category" placeholder="เช่น ยาปฏิชีวนะ" />
        </Field>
      </div>
      <Field label="จุดสั่งซื้อขั้นต่ำ (เตือนเมื่อต่ำกว่า)" htmlFor="minQty">
        <Input id="minQty" name="minQty" type="number" min={0} defaultValue={0} />
      </Field>
      <Field label="หมายเหตุ" htmlFor="note">
        <Textarea id="note" name="note" rows={2} />
      </Field>
    </ActionForm>
  );
}
