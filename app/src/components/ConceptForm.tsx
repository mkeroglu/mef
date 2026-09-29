"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ConceptInitial = {
  id?: string;
  name?: string;
  subtitle?: string;
  description?: string;
  order?: number;
  active?: boolean;
  imageUrl?: string;
};

export default function ConceptForm({ initial }: { initial?: ConceptInitial }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name || "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [active, setActive] = useState(initial?.active ?? true);
  const [preview, setPreview] = useState<string | null>(initial?.imageUrl || null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData();
    form.set("name", name);
    form.set("subtitle", subtitle);
    form.set("description", description);
    form.set("order", String(order));
    if (isEdit) form.set("active", String(active));
    if (file) form.set("image", file);

    const res = await fetch(isEdit ? `/api/admin/concepts/${initial!.id}` : "/api/admin/concepts", {
      method: isEdit ? "PATCH" : "POST",
      body: form,
    });

    if (res.ok) {
      router.push("/admin/concepts");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Kaydedilemedi");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: 30, display: "grid", gap: 20, maxWidth: 640 }}>
      <div>
        <label>Konsept Adı</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </div>
      <div>
        <label>Alt Başlık</label>
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} required minLength={2} />
      </div>
      <div>
        <label>Açıklama</label>
        <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required minLength={10} />
      </div>
      <div className="grid-2">
        <div>
          <label>Sıra</label>
          <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </div>
        {isEdit && (
          <div>
            <label>Durum</label>
            <select value={active ? "true" : "false"} onChange={(e) => setActive(e.target.value === "true")}>
              <option value="true">Yayında</option>
              <option value="false">Gizli</option>
            </select>
          </div>
        )}
      </div>
      <div>
        <label>Görsel {isEdit ? "(değiştirmek için yeni dosya seçin)" : ""}</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} required={!isEdit} />
        {preview && (
          <div style={{ marginTop: 12, position: "relative", width: 220, aspectRatio: "4/3", borderRadius: 10, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Önizleme" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
      </div>

      {error && <p style={{ color: "#a33" }}>{error}</p>}

      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Kaydediliyor..." : isEdit ? "Değişiklikleri Kaydet" : "Konsept Oluştur"}
        </button>
        <button type="button" className="btn btn-outline" onClick={() => router.push("/admin/concepts")}>
          Vazgeç
        </button>
      </div>
    </form>
  );
}
