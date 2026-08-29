"use client";

import { useState } from "react";

type OptionItem = {
  id: string;
  label: string;
  imageUrl: string | null;
  order: number;
  active: boolean;
};

type Group = {
  id: string;
  key: string;
  label: string;
  type: "SINGLE_SELECT" | "BOOLEAN";
  helpText: string | null;
  imageUrl: string | null;
  required: boolean;
  order: number;
  active: boolean;
  options: OptionItem[];
};

const thumbStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 8,
  overflow: "hidden",
  flexShrink: 0,
  background: "rgba(184,137,76,0.12)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  color: "var(--ink-soft)",
  textAlign: "center",
};

export default function OptionGroupEditor({ group, onChange }: { group: Group; onChange: () => void }) {
  const [label, setLabel] = useState(group.label);
  const [helpText, setHelpText] = useState(group.helpText || "");
  const [required, setRequired] = useState(group.required);
  const [active, setActive] = useState(group.active);
  const [savingGroup, setSavingGroup] = useState(false);
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);

  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionFile, setNewOptionFile] = useState<File | null>(null);
  const [addingOption, setAddingOption] = useState(false);

  async function saveGroup() {
    setSavingGroup(true);
    const form = new FormData();
    form.set("label", label);
    form.set("helpText", helpText);
    form.set("required", String(required));
    form.set("active", String(active));
    if (groupImageFile) form.set("image", groupImageFile);
    await fetch(`/api/admin/option-groups/${group.id}`, { method: "PATCH", body: form });
    setGroupImageFile(null);
    setSavingGroup(false);
    onChange();
  }

  async function addOption(e: React.FormEvent) {
    e.preventDefault();
    if (!newOptionLabel.trim()) return;
    setAddingOption(true);
    const form = new FormData();
    form.set("label", newOptionLabel);
    form.set("order", String((group.options.at(-1)?.order ?? 0) + 1));
    if (newOptionFile) form.set("image", newOptionFile);
    await fetch(`/api/admin/option-groups/${group.id}/options`, { method: "POST", body: form });
    setNewOptionLabel("");
    setNewOptionFile(null);
    setAddingOption(false);
    onChange();
  }

  async function toggleOptionActive(opt: OptionItem) {
    await fetch(`/api/admin/options/${opt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !opt.active }),
    });
    onChange();
  }

  async function replaceOptionImage(opt: OptionItem, file: File) {
    const form = new FormData();
    form.set("image", file);
    await fetch(`/api/admin/options/${opt.id}`, { method: "PATCH", body: form });
    onChange();
  }

  return (
    <div className="card" style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1, display: "grid", gap: 10 }}>
          <input value={label} onChange={(e) => setLabel(e.target.value)} style={{ fontWeight: 700, fontSize: 17 }} />
          <input
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            placeholder="Yardım metni / fiyat notu (opsiyonel, örn. 500 TL)"
          />
          <div style={{ display: "flex", gap: 20, alignItems: "center", fontSize: 14 }}>
            <span className="badge badge-pending">{group.type === "SINGLE_SELECT" ? "Tekli Seçim" : "Evet/Hayır"}</span>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0, textTransform: "none" }}>
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} style={{ width: "auto" }} />
              Zorunlu
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0, textTransform: "none" }}>
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} style={{ width: "auto" }} />
              Aktif (formda görünsün)
            </label>
          </div>
        </div>
        <button className="btn" style={{ padding: "8px 16px", fontSize: 14 }} onClick={saveGroup} disabled={savingGroup}>
          {savingGroup ? "..." : "Kaydet"}
        </button>
      </div>

      {group.type === "BOOLEAN" && (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={thumbStyle}>
            {group.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.imageUrl} alt={group.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              "Görsel yok"
            )}
          </div>
          <div>
            <label style={{ marginBottom: 4 }}>Referans Görsel</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setGroupImageFile(e.target.files?.[0] || null)} />
          </div>
        </div>
      )}

      {group.type === "SINGLE_SELECT" && (
        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ marginBottom: 0 }}>Seçenekler</label>
          {group.options.map((opt) => (
            <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={thumbStyle}>
                {opt.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={opt.imageUrl} alt={opt.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  "Görsel yok"
                )}
              </div>
              <span style={{ flex: 1, opacity: opt.active ? 1 : 0.5 }}>{opt.label}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ width: 160, fontSize: 12 }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) replaceOptionImage(opt, f);
                }}
              />
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "6px 12px", fontSize: 13 }}
                onClick={() => toggleOptionActive(opt)}
              >
                {opt.active ? "Gizle" : "Göster"}
              </button>
            </div>
          ))}

          <form onSubmit={addOption} style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
            <input
              value={newOptionLabel}
              onChange={(e) => setNewOptionLabel(e.target.value)}
              placeholder="Yeni seçenek adı"
              style={{ flex: 1 }}
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ width: 160, fontSize: 12 }}
              onChange={(e) => setNewOptionFile(e.target.files?.[0] || null)}
            />
            <button type="submit" className="btn" style={{ padding: "8px 16px", fontSize: 14 }} disabled={addingOption}>
              + Ekle
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
