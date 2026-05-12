"use client";
import { useTransition } from "react";
import { toggleAttendance } from "@/app/(app)/actions";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type Row = {
  attendanceId: string;
  teamMemberId: string;
  name: string;
  role: string | null;
  present: boolean;
};

export function AttendanceRow({ row }: { row: Row }) {
  const [pending, start] = useTransition();
  function onToggle() {
    haptic("select");
    const fd = new FormData();
    fd.set("teamMemberId", row.teamMemberId);
    fd.set("present", String(!row.present));
    start(() => {
      toggleAttendance(fd);
    });
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      className={cn(
        "w-full flex items-center justify-between px-5 py-5 min-h-[64px] border-b border-ink/10 text-left transition-colors active:bg-ink/[0.06]",
        row.present ? "bg-ink/[0.04]" : "hover:bg-ink/[0.02]",
      )}
    >
      <div>
        <div className="font-serif text-lg">{row.name}</div>
        {row.role && (
          <div className="text-xs uppercase tracking-wider2 text-muted">
            {row.role}
          </div>
        )}
      </div>
      <div
        className={cn(
          "h-7 w-7 border border-ink flex items-center justify-center",
          row.present ? "bg-ink text-paper" : "bg-transparent",
        )}
        aria-hidden
      >
        {row.present ? "—" : ""}
      </div>
    </button>
  );
}
