"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { formatPhoneDisplay, waLink } from "@/lib/phone";

const statusLabel: Record<string, string> = { PENDING: "Bekliyor", APPROVED: "Onaylandı", REJECTED: "Reddedildi" };
const statusClass: Record<string, string> = { PENDING: "badge-pending", APPROVED: "badge-approved", REJECTED: "badge-rejected" };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(184,137,76,0.15)" }}>
      <span style={{ color: "var(--ink-soft)", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <span style={{ fontSize: 16 }}>{value}</span>
    </div>
  );
}

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function load() {
    fetch(`/api/admin/requests/${params.id}`)
      .then((r) => r.json())
      .then(setData);
  }

  useEffect(load, [params.id]);

  async function handleAction(action: "approve" | "reject") {
    setBusy(true);
    setErrorMsg("");
    const res = await fetch(`/api/admin/requests/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setErrorMsg(d.error || "İşlem başarısız oldu");
    }
    setBusy(false);
  }

  if (!data) {
    return (
      <AdminShell>
        <p>Yükleniyor...</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <button className="btn btn-outline" style={{ padding: "6px 14px", fontSize: 14, marginBottom: 20 }} onClick={() => router.push("/admin/dashboard")}>
        ← Taleplere Dön
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="font-display" style={{ margin: 0 }}>
          {data.customerName}
        </h1>
        <span className={`badge ${statusClass[data.status]}`}>{statusLabel[data.status]}</span>
      </div>

      {errorMsg && <p style={{ color: "#a33" }}>{errorMsg}</p>}

      {data.status === "PENDING" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button className="btn" disabled={busy} onClick={() => handleAction("approve")}>
            Onayla
          </button>
          <button className="btn btn-outline" disabled={busy} onClick={() => handleAction("reject")}>
            Reddet
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 28, display: "grid", gap: 24 }}>
        <div>
          <h3 className="font-display" style={{ color: "var(--gold-deep)", margin: "0 0 8px" }}>
            Çift ve İletişim
          </h3>
          <Row label="Gelin" value={data.gelinAdi || "-"} />
          <Row label="Damat" value={data.damatAdi || "-"} />
          <Row
            label="Telefon"
            value={
              <a href={waLink(data.phone, `Merhaba ${data.customerName}, MEF Organizasyon'dan yazıyoruz.`)} target="_blank" rel="noopener noreferrer" style={{ color: "#3f6b3f", fontWeight: 600 }}>
                0{formatPhoneDisplay(data.phone)} — WhatsApp'tan yaz ↗
              </a>
            }
          />
          <Row label="2. İletişim" value={data.ikinciIletisim || "-"} />
          <Row label="E-posta" value={data.email || "-"} />
          <Row label="Adres" value={data.adres || "-"} />
        </div>

        <div>
          <h3 className="font-display" style={{ color: "var(--gold-deep)", margin: "0 0 8px" }}>
            Organizasyon
          </h3>
          <Row label="Tür" value={data.organizationTypeLabel || "-"} />
          <Row label="Tarih" value={new Date(data.eventDate).toLocaleDateString("tr-TR")} />
          <Row label="Kurulum Saati" value={data.kurulumSaati || "-"} />
          <Row label="Kat" value={data.katLabel || "-"} />
          <Row label="Asansör" value={data.asansorVarMi === null ? "-" : data.asansorVarMi ? "Var" : "Yok"} />
          <Row label="Konsept" value={data.concept?.name || "-"} />
          <Row label="Davetli Sayısı" value={data.guestCount ?? "-"} />
        </div>

        {data.configSummary?.length > 0 && (
          <div>
            <h3 className="font-display" style={{ color: "var(--gold-deep)", margin: "0 0 8px" }}>
              Seçimler
            </h3>
            {data.configSummary.map((c: { label: string; value: string }) => (
              <Row key={c.label} label={c.label} value={c.value} />
            ))}
          </div>
        )}

        {data.message && (
          <div>
            <h3 className="font-display" style={{ color: "var(--gold-deep)", margin: "0 0 8px" }}>
              Not
            </h3>
            <p style={{ margin: 0 }}>{data.message}</p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
