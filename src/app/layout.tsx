import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Law OX",
  description: "변호사시험 기출 OX 학습",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f2f2f2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="flex flex-col h-screen" style={{ background: "#f2f2f2" }}>
        <ServiceWorkerRegister />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
