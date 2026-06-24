import { Card, CardContent } from "@/components/ui/card";
import { TransferForm } from "@/components/forms/transfer-form";
import { getAvailabilityMap, getRefMaps } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function TransferPage() {
  const [{ drugs, warehouses }, available] = await Promise.all([
    getRefMaps(),
    getAvailabilityMap(),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl">ย้ายคลัง</h1>
        <p className="text-muted mt-1">
          เบิกยาจากคลังหนึ่งไปอีกคลังหนึ่ง ระบบตัด Lot ตามหลัก FIFO ให้อัตโนมัติ
        </p>
      </div>
      <Card>
        <CardContent>
          {warehouses.length < 2 ? (
            <p className="text-muted">
              ต้องมีอย่างน้อย 2 คลังจึงจะย้ายคลังได้
            </p>
          ) : (
            <TransferForm
              drugs={drugs}
              warehouses={warehouses}
              available={available}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
