import { Card, CardContent } from "@/components/ui/card";
import { ExpiryBadge } from "@/components/expiry-badge";
import { getExpiringLots } from "@/lib/stock";
import { expiryWarnDays } from "@/lib/config";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const expiring = await getExpiringLots();
  const expired = expiring.filter((e) => e.status === "expired");
  const critical = expiring.filter((e) => e.status === "critical");
  const warning = expiring.filter((e) => e.status === "warning");

  const groups = [
    { title: "หมดอายุแล้ว", items: expired, tone: "text-accent" },
    { title: "ใกล้หมดอายุมาก", items: critical, tone: "text-accent" },
    { title: "ใกล้หมดอายุ", items: warning, tone: "text-flag" },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">แจ้งเตือนยาหมดอายุ</h1>
        <p className="text-muted mt-1">
          แสดง Lot ที่หมดอายุแล้วหรือจะหมดอายุภายใน {expiryWarnDays} วัน
        </p>
      </div>

      {expiring.length === 0 ? (
        <Card>
          <CardContent className="text-muted">
            ไม่มียาใกล้หมดอายุในขณะนี้ — เยี่ยมมาก
          </CardContent>
        </Card>
      ) : (
        groups.map((g) => (
          <section key={g.title} className="space-y-2">
            <h2 className={"font-serif text-xl " + g.tone}>
              {g.title} ({g.items.length})
            </h2>
            <Card>
              <ul className="divide-y divide-ink/10">
                {g.items.map((l) => (
                  <li
                    key={l.id}
                    className="px-6 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate">{l.drug.name}</div>
                      <div className="text-xs text-muted">
                        Lot {l.lotNo} · {l.warehouse.name} · EXP{" "}
                        {formatDate(l.expiryDate)} · คงเหลือ{" "}
                        {formatNumber(l.quantity)} {l.drug.unit}
                      </div>
                    </div>
                    <ExpiryBadge status={l.status} daysLeft={l.daysLeft} />
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))
      )}
    </div>
  );
}
