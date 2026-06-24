import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { InstallHint } from "@/components/install-hint";

export const metadata: Metadata = {
  title: "StockYa · ระบบสต๊อกยา",
  description:
    "จัดการสต๊อกยา เบิก-ย้ายคลัง ตาม Lot และ FIFO พร้อมแจ้งเตือนยาหมดอายุ",
  applicationName: "StockYa",
  appleWebApp: {
    capable: true,
    title: "StockYa",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false, email: false, address: false },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "StockYa",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#f7f3ec" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <Providers>{children}</Providers>
        <InstallHint />
      </body>
    </html>
  );
}
