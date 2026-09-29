"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, padding: "18px 0" }}>
      <div
        className="container"
        style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <Link
          href="/"
          className="font-display"
          style={{ fontSize: 26, color: "var(--gold-deep)", textDecoration: "none" }}
          onClick={() => setOpen(false)}
        >
          MEF <span style={{ color: "var(--ink)", fontWeight: 500 }}>Organizasyon</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{
            background: "none",
            border: "1px solid rgba(184,137,76,0.4)",
            borderRadius: 10,
            width: 42,
            height: 38,
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--gold-deep)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            {open ? (
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <>
                <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>

        <nav className={`nav-links${open ? " open" : ""}`} style={{ alignItems: "center", gap: 28 }}>
          <Link href="/#konseptler" style={{ textDecoration: "none" }} onClick={() => setOpen(false)}>
            Konseptler
          </Link>
          <Link href="/#hakkimizda" style={{ textDecoration: "none" }} onClick={() => setOpen(false)}>
            Hakkımızda
          </Link>
          <Link href="/talep" className="btn" onClick={() => setOpen(false)}>
            Organizasyon Talebi
          </Link>
        </nav>
      </div>
    </header>
  );
}
