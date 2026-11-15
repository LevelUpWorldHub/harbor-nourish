import type { Metadata, Viewport } from "next";
import "@fontsource/atkinson-hyperlegible/latin-400.css";
import "@fontsource/atkinson-hyperlegible/latin-700.css";
import { Shell } from "@/components/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harbor — flare-watch companion",
  description: "A nutrition and flare-watch companion for people with autoimmune conditions. Your journal stays on this device unless you consent to a meal-photo check.",
  applicationName: "Harbor",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Harbor", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#163e3b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
