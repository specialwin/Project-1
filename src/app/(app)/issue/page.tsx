import { Card, CardContent } from "@/components/ui/card";
import { IssueForm } from "@/components/forms/issue-form";
import { getAvailabilityMap, getRefMaps } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function IssuePage() {
  const [{ drugs, warehouses }, available] = await Promise.all([
    getRefMaps(),
    getAvailabilityMap(),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl">เบิกยาออก</h1>
        <p className="text-muted mt-1">
          ระบบจะเลือก Lot ให้อัตโนมัติตามหลัก FIFO (หมดอายุก่อน–ออกก่อน)
        </p>
      </div>
      <Card>
        <CardContent>
          <IssueForm
            drugs={drugs}
            warehouses={warehouses}
            available={available}
          />
        </CardContent>
      </Card>
    </div>
  );
}
