import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listTransactionsWithRefs } from "@/lib/stock";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { TxnType } from "@/lib/types";

export const dynamic = "force-dynamic";

const typeMeta: Record<TxnType, { label: string; cls: string }> = {
  RECEIVE: { label: "รับเข้า", cls: "bg-ink/5 border-ink/20 text-ink" },
  ISSUE: { label: "เบิกออก", cls: "bg-accent/10 border-accent/40 text-accent" },
  TRANSFER: { label: "ย้ายคลัง", cls: "bg-flag/10 border-flag/40 text-flag" },
  ADJUST: { label: "ปรับปรุง", cls: "bg-ink/5 border-ink/20 text-muted" },
};

export default async function HistoryPage() {
  const txns = await listTransactionsWithRefs(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">ประวัติการเคลื่อนไหว</h1>
        <p className="text-muted mt-1">
          บันทึกการรับเข้า เบิกออก และย้ายคลังทั้งหมด
        </p>
      </div>

      {txns.length === 0 ? (
        <Card>
          <CardContent className="text-muted">
            ยังไม่มีรายการเคลื่อนไหว
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-ink/10">
            {txns.map((t) => {
              const meta = typeMeta[t.type];
              const route =
                t.type === "RECEIVE"
                  ? `→ ${t.toWarehouse?.name ?? ""}`
                  : t.type === "ISSUE"
                    ? `${t.fromWarehouse?.name ?? ""} →`
                    : t.type === "TRANSFER"
                      ? `${t.fromWarehouse?.name ?? ""} → ${t.toWarehouse?.name ?? ""}`
                      : "";
              return (
                <li key={t.id} className="px-6 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={meta.cls}>{meta.label}</Badge>
                        <span className="truncate">
                          {t.drug?.name ?? t.drugId}
                        </span>
                      </div>
                      <div className="text-xs text-muted mt-1">
                        Lot {t.lotNo} · {route} · {formatDateTime(t.createdAt)}
                        {t.userEmail ? ` · ${t.userEmail}` : ""}
                      </div>
                      {t.note && (
                        <div className="text-xs text-muted mt-0.5">
                          หมายเหตุ: {t.note}
                        </div>
                      )}
                    </div>
                    <div className="numeric shrink-0 text-right">
                      {formatNumber(t.quantity)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
