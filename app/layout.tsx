import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Backdrop } from "@/components/Decor";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Sawerku — kirim pesan ke game Roblox",
  description: "Ketik username Roblox dan kata-katamu, pesannya langsung tampil di papan donasi dalam game.",
};

export const viewport: Viewport = { themeColor: "#070910", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={sans.variable}>
      <body>
        <Backdrop />
        {children}
      </body>
    </html>
  );
}
