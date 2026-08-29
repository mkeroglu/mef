"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { waLink } from "@/lib/phone";

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [number, setNumber] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public-settings")
      .then((r) => r.json())
      .then((data) => setNumber(data.whatsappBusinessNumber || null))
      .catch(() => {});
  }, []);

  if (!number || pathname?.startsWith("/admin")) return null;

  return (
    <a
      href={waLink(number, "Merhaba, MEF Organizasyon hakkında bilgi almak istiyorum.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp'tan yaz"
      style={{
        position: "fixed",
        right: 22,
        bottom: 22,
        zIndex: 50,
        width: 58,
        height: 58,
        borderRadius: "50%",
        background: "#25D366",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 24px -8px rgba(0,0,0,0.4)",
        textDecoration: "none",
      }}
    >
      <svg viewBox="0 0 32 32" width="30" height="30" fill="#fff" aria-hidden="true">
        <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.7 4.607 1.902 6.475L4 29l7.72-1.867A11.94 11.94 0 0 0 16.001 27C22.628 27 28 21.627 28 15S22.628 3 16.001 3zm0 21.75a9.7 9.7 0 0 1-4.95-1.36l-.355-.21-4.583 1.108 1.128-4.464-.232-.366A9.7 9.7 0 0 1 5.25 15c0-5.928 4.823-10.75 10.751-10.75S26.75 9.072 26.75 15 21.929 24.75 16.001 24.75zm5.55-8.06c-.304-.152-1.797-.887-2.076-.988-.279-.101-.482-.152-.686.152-.203.304-.786.988-.964 1.19-.178.203-.355.228-.66.076-.304-.152-1.283-.473-2.444-1.508-.903-.805-1.513-1.8-1.69-2.104-.178-.304-.019-.469.133-.62.137-.136.304-.355.457-.533.152-.178.203-.304.304-.507.101-.203.05-.38-.025-.533-.076-.152-.686-1.653-.94-2.264-.248-.596-.5-.515-.686-.524l-.584-.01c-.203 0-.533.076-.812.38-.279.304-1.066 1.042-1.066 2.542s1.091 2.949 1.243 3.152c.152.203 2.148 3.28 5.206 4.6.727.314 1.294.501 1.736.641.729.232 1.393.199 1.918.121.585-.087 1.797-.735 2.05-1.445.254-.71.254-1.318.178-1.445-.076-.127-.279-.203-.583-.355z" />
      </svg>
    </a>
  );
}
