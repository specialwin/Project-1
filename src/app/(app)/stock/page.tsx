import { Card, CardContent, SectionLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExpiryBadge } from "@/components/expiry-badge";
import { getDrugStockSummary, listLotsWithRefs } from "@/lib/stock";
import { daysUntil, expiryStatus } from "@/lib/expiry";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const [summary, lots] = await Promise.all([
    getDrugStockSummary(),
    listLotsWithRefs(),
  ]);

  const lotsByDrug = new Map<string, typeof lots>();
  for (const l of lots) {
    if (l.quantity <= 0) continue;
    const arr = lotsByDrug.get(l.drugId) ?? [];
    arr.push(l);
    lotsByDrug.set(l.drugId, arr);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">สต๊อกคงเหลือ</h1>
        <p className="text-muted mt-1">
          ยอดคงเหลือแยกตามยา คลัง และ Lot (เรียง Lot ตามวันหมดอายุ)
        </p>
      </div>

      <div className="space-y-4">
        {summary.map((s) => {
          const drugLots = (lotsByDrug.get(s.drug.id) ?? []).sort((a, b) =>
            a.expiryDate.localeCompare(b.expiryDate),
          );
          return (
            <Card key={s.drug.id}>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-serif text-xl">{s.drug.name}</div>
                    <div className="text-xs text-muted">
                      {s.drug.code}
                      {s.drug.genericName ? ` · ${s.drug.genericName}` : ""}
                      {s.drug.category ? ` · ${s.drug.category}` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-serif text-2xl numeric">
                      {formatNumber(s.total)}
                    </div>
                    <div className="text-xs text-muted">{s.drug.unit}</div>
                  </div>
                </div>

                {s.belowMin && (
                  <Badge className="bg-accent/10 text-accent border-accent/40">
                    ต่ำกว่าจุดสั่งซื้อ ({formatNumber(s.drug.minQty)} {s.drug.unit})
                  </Badge>
                )}

                {/* แยกตามคลัง */}
                {s.byWarehouse.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {s.byWarehouse.map((w) => (
                      <Badge
                        key={w.warehouse.id}
                        className="bg-ink/5 border-ink/15 text-ink"
                      >
                        {w.warehouse.name}: {formatNumber(w.quantity)}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* รายละเอียด Lot */}
                {drugLots.length === 0 ? (
                  <p className="text-sm text-muted">ไม่มีคงเหลือ</p>
                ) : (
                  <div>
                    <SectionLabel className="mb-2">
                      Lot ({drugLots.length})
                    </SectionLabel>
                    <ul className="divide-y divide-ink/10 border-t border-ink/10">
                      {drugLots.map((l) => (
                        <li
                          key={l.id}
                          className="py-2 flex items-center justify-between gap-3 text-sm"
                        >
                          <div className="min-w-0">
                            <span className="font-medium">{l.lotNo}</span>
                            <span className="text-muted">
                              {" "}
                              · {l.warehouse.name} · EXP{" "}
                              {formatDate(l.expiryDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <ExpiryBadge
                              status={expiryStatus(l.expiryDate)}
                              daysLeft={daysUntil(l.expiryDate)}
                            />
                            <span className="numeric w-16 text-right">
                              {formatNumber(l.quantity)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
