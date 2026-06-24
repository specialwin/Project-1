import Link from "next/link";
import {
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
  AlertTriangle,
  Boxes,
} from "lucide-react";
import { Card, CardContent, SectionLabel } from "@/components/ui/card";
import { ExpiryBadge } from "@/components/expiry-badge";
import {
  getDrugStockSummary,
  getExpiringLots,
  getRefMaps,
} from "@/lib/stock";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "accent" | "flag";
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <SectionLabel>{label}</SectionLabel>
        <div
          className={
            "mt-1 font-serif text-3xl numeric " +
            (tone === "accent"
              ? "text-accent"
              : tone === "flag"
                ? "text-flag"
                : "text-ink")
          }
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

const quickActions = [
  { href: "/receive", label: "รับเข้า", icon: PackagePlus },
  { href: "/issue", label: "เบิกออก", icon: PackageMinus },
  { href: "/transfer", label: "ย้ายคลัง", icon: ArrowLeftRight },
];

export default async function DashboardPage() {
  const [summary, expiring, { warehouses }] = await Promise.all([
    getDrugStockSummary(),
    getExpiringLots(),
    getRefMaps(),
  ]);

  const belowMin = summary.filter((s) => s.belowMin);
  const expiredOrCritical = expiring.filter(
    (e) => e.status === "expired" || e.status === "critical",
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">ภาพรวมสต๊อก</h1>
        <p className="text-muted mt-1">
          สรุปสถานะคลังยา การแจ้งเตือน และทางลัดการทำงาน
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="รายการยา" value={formatNumber(summary.length)} />
        <Stat label="คลัง" value={formatNumber(warehouses.length)} />
        <Stat
          label="ใกล้/เกินหมดอายุ"
          value={formatNumber(expiring.length)}
          tone={expiring.length ? "flag" : undefined}
        />
        <Stat
          label="ต่ำกว่าจุดสั่งซื้อ"
          value={formatNumber(belowMin.length)}
          tone={belowMin.length ? "accent" : undefined}
        />
      </div>

      {/* ทางลัด */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="hover:bg-ink/5 transition-colors">
              <CardContent className="py-5 flex flex-col items-center gap-2 text-center">
                <Icon className="h-6 w-6 text-accent" />
                <span className="text-sm">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* แจ้งเตือนหมดอายุ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-flag" />
            แจ้งเตือนยาหมดอายุ
          </h2>
          <Link
            href="/alerts"
            className="text-sm uppercase tracking-wider2 text-muted hover:text-ink"
          >
            ดูทั้งหมด
          </Link>
        </div>
        {expiring.length === 0 ? (
          <Card>
            <CardContent className="text-muted">
              ไม่มียาใกล้หมดอายุในขณะนี้
            </CardContent>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-ink/10">
              {expiring.slice(0, 6).map((l) => (
                <li
                  key={l.id}
                  className="px-6 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="truncate">{l.drug.name}</div>
                    <div className="text-xs text-muted">
                      Lot {l.lotNo} · {l.warehouse.name} · หมดอายุ{" "}
                      {formatDate(l.expiryDate)} · คงเหลือ{" "}
                      {formatNumber(l.quantity)} {l.drug.unit}
                    </div>
                  </div>
                  <ExpiryBadge status={l.status} daysLeft={l.daysLeft} />
                </li>
              ))}
            </ul>
          </Card>
        )}
        {expiredOrCritical.length > 0 && (
          <p className="text-sm text-accent">
            มี {expiredOrCritical.length} Lot ที่หมดอายุแล้วหรือใกล้หมดอายุมาก
            ควรตรวจสอบโดยด่วน
          </p>
        )}
      </section>

      {/* สต๊อกต่ำ */}
      {belowMin.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-serif text-2xl flex items-center gap-2">
            <Boxes className="h-5 w-5 text-accent" />
            สต๊อกต่ำกว่าจุดสั่งซื้อ
          </h2>
          <Card>
            <ul className="divide-y divide-ink/10">
              {belowMin.map((s) => (
                <li
                  key={s.drug.id}
                  className="px-6 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="truncate">{s.drug.name}</div>
                    <div className="text-xs text-muted">
                      จุดสั่งซื้อ {formatNumber(s.drug.minQty)} {s.drug.unit}
                    </div>
                  </div>
                  <div className="text-accent numeric">
                    {formatNumber(s.total)} {s.drug.unit}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
