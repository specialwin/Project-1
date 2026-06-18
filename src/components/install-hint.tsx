"use client";
import { useEffect, useState } from "react";

const DISMISS_KEY = "stockya.installHint.dismissed";

// แนะนำ "เพิ่มไปยังหน้าจอโฮม" บน iOS Safari (เฉพาะตอนเปิดในเบราว์เซอร์)
export function InstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    if (!isIOS) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    if (standalone) return;

    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    setVisible(true);
  }, []);

  if (!visible) return null;
  return (
    <div
      className="ios-install-hint fixed left-3 right-3 bottom-3 z-40 border border-ink/15 bg-paper text-ink shadow-card"
      role="note"
      style={{ paddingBottom: `calc(0.75rem + var(--safe-bottom))` }}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="flex-1 text-sm leading-snug">
          <div className="font-serif text-base">ติดตั้ง StockYa</div>
          <div className="text-muted">
            กดปุ่มแชร์ใน Safari แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”
            เพื่อเปิดแบบเต็มจอเหมือนแอป
          </div>
        </div>
        <button
          onClick={() => {
            try {
              window.localStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* ignore */
            }
            setVisible(false);
          }}
          className="text-[0.72rem] uppercase tracking-wider3 text-muted hover:text-ink px-2 py-1"
          aria-label="ปิดคำแนะนำ"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
