"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "Talepler" },
  { href: "/admin/bookings", label: "Takvim" },
  { href: "/admin/concepts", label: "Konseptler" },
  { href: "/admin/options", label: "Seçenekler" },
  { href: "/admin/settings", label: "Ayarlar" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ padding: "18px 0", borderBottom: "1px solid rgba(184,137,76,0.25)" }}>
        <div
          className="container"
          style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", rowGap: 10 }}
        >
          <span className="font-display" style={{ fontSize: 22, color: "var(--gold-deep)" }}>
            MEF Admin
          </span>
          <nav style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px", alignItems: "center" }}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  textDecoration: "none",
                  fontWeight: pathname === l.href ? 700 : 400,
                  color: pathname === l.href ? "var(--gold-deep)" : "var(--ink)",
                }}
              >
                {l.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: "8px 18px" }}>
              Çıkış
            </button>
          </nav>
        </div>
      </header>
      <main className="container" style={{ padding: "32px 0 60px" }}>
        {children}
      </main>
    </div>
  );
}
