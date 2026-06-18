import { getUserOrRedirect } from "@/lib/session";
import { storeMode } from "@/lib/store";
import { getExpiringLots } from "@/lib/stock";
import { AppNav } from "@/components/app-nav";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserOrRedirect();
  const alerts = await getExpiringLots();
  const alertCount = alerts.filter(
    (a) => a.status === "expired" || a.status === "critical",
  ).length;

  return (
    <>
      <AppNav
        alertCount={alertCount}
        mode={storeMode()}
        userName={user.name ?? user.email ?? ""}
      />
      <main className="container py-6">{children}</main>
      <footer className="app-footer container py-8 text-[0.7rem] uppercase tracking-wider3 text-muted">
        StockYa · ระบบบริหารสต๊อกยา
      </footer>
    </>
  );
}
