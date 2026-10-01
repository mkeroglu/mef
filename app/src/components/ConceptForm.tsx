"use client";

import { useEffect, useState } from "react";
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

type GalleryImage = { id: string; url: string };

function ConceptGallery({ conceptId }: { conceptId: string }) {
  const [images, setImages] = useState<GalleryImage[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch(`/api/admin/concepts/${conceptId}`)
      .then((r) => r.json())
      .then((data) => setImages(data.images || []));
  }

  useEffect(load, [conceptId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");

    const form = new FormData();
    for (const f of Array.from(files)) form.append("images", f);

    const res = await fetch(`/api/admin/concepts/${conceptId}/gallery`, { method: "POST", body: form });
    if (res.ok) {
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Yüklenemedi");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleDelete(imageId: string) {
    await fetch(`/api/admin/concepts/${conceptId}/gallery/${imageId}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="card" style={{ padding: 30, display: "grid", gap: 16, maxWidth: 640, marginTop: 24 }}>
      <div>
        <label>Galeri Fotoğrafları</label>
        <p style={{ color: "var(--ink-soft)", fontSize: 15, margin: "0 0 10px" }}>
          Kapak fotoğrafına ek olarak, müşterinin konsept sayfasında tıklayıp slayt şeklinde gezebileceği
          ekstra fotoğraflar. Birden fazla dosya seçebilirsiniz.
        </p>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleUpload} disabled={uploading} />
        {uploading && <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 6 }}>Yükleniyor...</p>}
        {error && <p style={{ color: "#a33", fontSize: 14, marginTop: 6 }}>{error}</p>}
      </div>

      {images && images.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {images.map((img) => (
            <div key={img.id} style={{ position: "relative", width: 110, aspectRatio: "4/3", borderRadius: 10, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                aria-label="Fotoğrafı sil"
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(60,44,26,0.75)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {images && images.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>Henüz galeri fotoğrafı yok.</p>}
    </div>
  );
}

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
      if (isEdit) {
        setSaving(false);
      } else {
        router.push("/admin/concepts");
        router.refresh();
      }
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Kaydedilemedi");
      setSaving(false);
    }
  }

  return (
    <>
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
          <label>Kapak Fotoğrafı {isEdit ? "(değiştirmek için yeni dosya seçin)" : ""}</label>
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
            {isEdit ? "Listeye Dön" : "Vazgeç"}
          </button>
        </div>
      </form>

      {isEdit && <ConceptGallery conceptId={initial!.id!} />}
    </>
  );
}
