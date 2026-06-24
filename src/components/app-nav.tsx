"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
  BellRing,
  Pill,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";

const links = [
  { href: "/", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/stock", label: "สต๊อก", icon: Package },
  { href: "/receive", label: "รับเข้า", icon: PackagePlus },
  { href: "/issue", label: "เบิกออก", icon: PackageMinus },
  { href: "/transfer", label: "ย้ายคลัง", icon: ArrowLeftRight },
  { href: "/alerts", label: "แจ้งเตือน", icon: BellRing },
  { href: "/drugs", label: "รายการยา", icon: Pill },
  { href: "/history", label: "ประวัติ", icon: History },
];

export function AppNav({
  alertCount,
  mode,
  userName,
}: {
  alertCount: number;
  mode: "airtable" | "demo";
  userName: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="app-header">
      <div className="container flex items-center justify-between py-3">
        <Link href="/" className="min-w-0 flex items-baseline gap-2">
          <span className="font-serif text-2xl text-accent leading-none">
            StockYa
          </span>
          <span className="text-[0.7rem] uppercase tracking-wider3 text-muted">
            {mode === "demo" ? "Demo" : "Airtable"}
          </span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden sm:inline text-muted truncate max-w-[10rem]">
            {userName}
          </span>
          <SignOutButton />
        </div>
      </div>

      <nav className="container">
        <ul className="flex gap-1 overflow-x-auto no-scrollbar pb-2 -mb-px">
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const showBadge = href === "/alerts" && alertCount > 0;
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors whitespace-nowrap",
                    active
                      ? "border-accent text-ink"
                      : "border-transparent text-muted hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {showBadge && (
                    <span className="ml-0.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-[0.65rem] bg-accent text-paper rounded-full">
                      {alertCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
