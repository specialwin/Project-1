import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { InstallHint } from "@/components/install-hint";

export const metadata: Metadata = {
  title: "Lineup",
  description: "The daily fifteen minutes.",
  applicationName: "Lineup",
  appleWebApp: {
    capable: true,
    title: "Lineup",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    // Legacy meta tags some iOS versions still respect.
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Lineup",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Allow user zoom for accessibility; PWA still feels native.
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
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <InstallHint />
      </body>
    </html>
  );
}
