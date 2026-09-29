"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import OptionGroupEditor from "@/components/OptionGroupEditor";

export default function OptionsPage() {
  const [groups, setGroups] = useState<any[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<"SINGLE_SELECT" | "BOOLEAN">("SINGLE_SELECT");
  const [newHelp, setNewHelp] = useState("");
  const [newRequired, setNewRequired] = useState(true);
  const [creating, setCreating] = useState(false);

  function load() {
    fetch("/api/admin/option-groups")
      .then((r) => r.json())
      .then(setGroups);
  }

  useEffect(load, []);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setCreating(true);
    const form = new FormData();
    form.set("label", newLabel);
    form.set("type", newType);
    form.set("helpText", newHelp);
    form.set("required", String(newRequired));
    form.set("order", String((groups?.at(-1)?.order ?? 0) + 1));
    await fetch("/api/admin/option-groups", { method: "POST", body: form });
    setNewLabel("");
    setNewHelp("");
    setNewType("SINGLE_SELECT");
    setNewRequired(true);
    setShowNew(false);
    setCreating(false);
    load();
  }

  return (
    <AdminShell>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 className="font-display" style={{ margin: 0 }}>
          Seçenek Grupları
        </h1>
        <button className="btn" onClick={() => setShowNew((s) => !s)}>
          {showNew ? "Vazgeç" : "+ Yeni Grup"}
        </button>
      </div>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Talep formundaki sehpa, çiçek, sandalye, tepsi, ekstra gibi seçim adımlarını burada yönetirsiniz. Yeni
        seçenek/görsel eklemek için koda dokunmanıza gerek yok.
      </p>

      {showNew && (
        <form onSubmit={createGroup} className="card" style={{ padding: 24, display: "grid", gap: 14, marginBottom: 24 }}>
          <div>
            <label>Grup Adı</label>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} required placeholder="örn. Masa Örtüsü Seçimi" />
          </div>
          <div className="grid-2" style={{ gap: 14 }}>
            <div>
              <label>Tip</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value as any)}>
                <option value="SINGLE_SELECT">Tekli Seçim (birden çok seçenek)</option>
                <option value="BOOLEAN">Evet/Hayır (tek görsel, ekstra gibi)</option>
              </select>
            </div>
            <div>
              <label>Yardım Metni (opsiyonel)</label>
              <input value={newHelp} onChange={(e) => setNewHelp(e.target.value)} placeholder="örn. 500 TL" />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, textTransform: "none" }}>
            <input type="checkbox" checked={newRequired} onChange={(e) => setNewRequired(e.target.checked)} style={{ width: "auto" }} />
            Zorunlu alan
          </label>
          <button type="submit" className="btn" disabled={creating} style={{ justifySelf: "start" }}>
            {creating ? "Oluşturuluyor..." : "Grubu Oluştur"}
          </button>
        </form>
      )}

      <div style={{ display: "grid", gap: 20 }}>
        {groups
          ?.slice()
          .sort((a, b) => a.order - b.order)
          .map((g) => <OptionGroupEditor key={g.id} group={g} onChange={load} />)}
      </div>
    </AdminShell>
  );
}
