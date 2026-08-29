import type { Metadata } from "next";
import AnimatedBackground from "@/components/AnimatedBackground";
import WhatsAppButton from "@/components/WhatsAppButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEF Organizasyon | Nişan & Söz Konsept Tasarımları",
  description:
    "MEF Organizasyon; nişan, söz ve özel davetleriniz için zarif sahne konseptleri tasarlar. Her anınız, özel ve unutulmaz olsun.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <AnimatedBackground />
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
