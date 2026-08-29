"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";

type Concept = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  active: boolean;
  imageUrl: string;
};

export default function ConceptsPage() {
  const [concepts, setConcepts] = useState<Concept[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/concepts")
      .then((r) => r.json())
      .then(setConcepts);
  }

  useEffect(load, []);

  async function toggleActive(c: Concept) {
    setSavingId(c.id);
    await fetch(`/api/admin/concepts/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    load();
    setSavingId(null);
  }

  return (
    <AdminShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 className="font-display" style={{ margin: 0 }}>
          Konseptler
        </h1>
        <Link href="/admin/concepts/new" className="btn">
          + Yeni Konsept
        </Link>
      </div>
      <div style={{ display: "grid", gap: 18 }}>
        {concepts?.map((c) => (
          <div key={c.id} className="card" style={{ padding: 22, display: "flex", gap: 20 }}>
            <div style={{ position: "relative", width: 120, height: 90, flexShrink: 0, borderRadius: 10, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.imageUrl} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 className="font-display" style={{ margin: "0 0 6px", color: "var(--gold-deep)" }}>
                {c.name}
              </h3>
              <p style={{ margin: "0 0 6px", color: "var(--ink-soft)" }}>{c.subtitle}</p>
              <p style={{ margin: 0, fontSize: 16, color: "var(--ink-soft)" }}>{c.description}</p>
            </div>
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href={`/admin/concepts/${c.id}`} className="btn btn-outline" style={{ padding: "8px 18px", fontSize: 14 }}>
                Düzenle
              </Link>
              <button
                className={c.active ? "btn" : "btn btn-outline"}
                style={{ padding: "8px 18px", fontSize: 14 }}
                disabled={savingId === c.id}
                onClick={() => toggleActive(c)}
              >
                {c.active ? "Yayında" : "Gizli"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
