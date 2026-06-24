import { Card, CardContent, SectionLabel } from "@/components/ui/card";
import { DrugForm } from "@/components/forms/drug-form";
import { WarehouseForm } from "@/components/forms/warehouse-form";
import { getRefMaps } from "@/lib/stock";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DrugsPage() {
  const { drugs, warehouses } = await getRefMaps();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">รายการยาและคลัง</h1>
        <p className="text-muted mt-1">จัดการทะเบียนยาและคลังเก็บยา</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ยา */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl">เพิ่มยา</h2>
          <Card>
            <CardContent>
              <DrugForm />
            </CardContent>
          </Card>

          <SectionLabel>ยาทั้งหมด ({drugs.length})</SectionLabel>
          <Card>
            {drugs.length === 0 ? (
              <CardContent className="text-muted">ยังไม่มีรายการยา</CardContent>
            ) : (
              <ul className="divide-y divide-ink/10">
                {drugs.map((d) => (
                  <li key={d.id} className="px-6 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate">{d.name}</div>
                        <div className="text-xs text-muted">
                          {d.code}
                          {d.genericName ? ` · ${d.genericName}` : ""} · หน่วย:{" "}
                          {d.unit}
                        </div>
                      </div>
                      <div className="text-xs text-muted shrink-0">
                        ขั้นต่ำ {formatNumber(d.minQty)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* คลัง */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl">เพิ่มคลัง</h2>
          <Card>
            <CardContent>
              <WarehouseForm />
            </CardContent>
          </Card>

          <SectionLabel>คลังทั้งหมด ({warehouses.length})</SectionLabel>
          <Card>
            {warehouses.length === 0 ? (
              <CardContent className="text-muted">ยังไม่มีคลัง</CardContent>
            ) : (
              <ul className="divide-y divide-ink/10">
                {warehouses.map((w) => (
                  <li key={w.id} className="px-6 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate">{w.name}</div>
                        <div className="text-xs text-muted">
                          {w.code}
                          {w.location ? ` · ${w.location}` : ""}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
