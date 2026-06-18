import { expiryCriticalDays, expiryWarnDays } from "./config";

export type ExpiryStatus = "expired" | "critical" | "warning" | "ok";

export function daysUntil(isoDate: string, now: Date = new Date()): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function expiryStatus(
  isoDate: string,
  now: Date = new Date(),
): ExpiryStatus {
  const d = daysUntil(isoDate, now);
  if (d < 0) return "expired";
  if (d <= expiryCriticalDays) return "critical";
  if (d <= expiryWarnDays) return "warning";
  return "ok";
}

export const expiryLabel: Record<ExpiryStatus, string> = {
  expired: "หมดอายุแล้ว",
  critical: "ใกล้หมดอายุมาก",
  warning: "ใกล้หมดอายุ",
  ok: "ปกติ",
};

// คลาส Tailwind สำหรับป้ายสถานะ
export const expiryBadgeClass: Record<ExpiryStatus, string> = {
  expired: "bg-accent/10 text-accent border-accent/40",
  critical: "bg-accent/10 text-accent border-accent/40",
  warning: "bg-flag/10 text-flag border-flag/40",
  ok: "bg-ink/5 text-muted border-ink/20",
};
