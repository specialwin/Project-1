import { Badge } from "@/components/ui/badge";
import {
  expiryBadgeClass,
  expiryLabel,
  type ExpiryStatus,
} from "@/lib/expiry";
import { cn } from "@/lib/utils";

export function ExpiryBadge({
  status,
  daysLeft,
}: {
  status: ExpiryStatus;
  daysLeft: number;
}) {
  const detail =
    status === "expired"
      ? `เกิน ${Math.abs(daysLeft)} วัน`
      : `อีก ${daysLeft} วัน`;
  return (
    <Badge className={cn(expiryBadgeClass[status])}>
      {expiryLabel[status]} · {detail}
    </Badge>
  );
}
