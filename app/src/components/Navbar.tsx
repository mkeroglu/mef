import Link from "next/link";

export default function Navbar() {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 20, padding: "18px 0" }}>
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <Link
          href="/"
          className="font-display"
          style={{ fontSize: 26, color: "var(--gold-deep)", textDecoration: "none" }}
        >
          MEF <span style={{ color: "var(--ink)", fontWeight: 500 }}>Organizasyon</span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/#konseptler" style={{ textDecoration: "none" }}>
            Konseptler
          </Link>
          <Link href="/#hakkimizda" style={{ textDecoration: "none" }}>
            Hakkımızda
          </Link>
          <Link href="/talep" className="btn">
            Organizasyon Talebi
          </Link>
        </nav>
      </div>
    </header>
  );
}
