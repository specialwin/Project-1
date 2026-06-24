import { Card, CardContent } from "@/components/ui/card";
import { ReceiveForm } from "@/components/forms/receive-form";
import { getRefMaps } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function ReceivePage() {
  const { drugs, warehouses } = await getRefMaps();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl">รับยาเข้าสต๊อก</h1>
        <p className="text-muted mt-1">
          เพิ่ม Lot ใหม่พร้อมวันหมดอายุเข้าคลัง ยาแต่ละตัวมีได้หลาย Lot
        </p>
      </div>
      <Card>
        <CardContent>
          {drugs.length === 0 ? (
            <p className="text-muted">
              ยังไม่มีรายการยา กรุณาเพิ่มยาที่หน้า “รายการยา” ก่อน
            </p>
          ) : (
            <ReceiveForm drugs={drugs} warehouses={warehouses} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
