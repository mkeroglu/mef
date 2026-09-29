"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { formatPhoneDisplay, waLink } from "@/lib/phone";

type BookingRequest = {
  id: string;
  customerName: string;
  phone: string;
  email: string | null;
  eventDate: string;
  guestCount: number | null;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  concept: { name: string };
  createdAt: string;
};

const statusLabel: Record<string, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
};

const statusClass: Record<string, string> = {
  PENDING: "badge-pending",
  APPROVED: "badge-approved",
  REJECTED: "badge-rejected",
};

export default function DashboardPage() {
  const [requests, setRequests] = useState<BookingRequest[] | null>(null);
  const [filter, setFilter] = useState<string>("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(() => {
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/admin/requests${qs}`)
      .then((r) => r.json())
      .then(setRequests);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setErrorMsg("");
    const res = await fetch(`/api/admin/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error || "İşlem başarısız oldu");
    }
    setBusyId(null);
  }

  return (
    <AdminShell>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 className="font-display" style={{ margin: 0 }}>
          Organizasyon Talepleri
        </h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 200, maxWidth: "100%" }}>
          <option value="PENDING">Bekleyenler</option>
          <option value="APPROVED">Onaylananlar</option>
          <option value="REJECTED">Reddedilenler</option>
          <option value="">Tümü</option>
        </select>
      </div>

      {errorMsg && <p style={{ color: "#a33" }}>{errorMsg}</p>}

      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Çift</th>
              <th>İletişim</th>
              <th>Tarih</th>
              <th>Konsept</th>
              <th>Davetli</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {requests?.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/requests/${r.id}`} style={{ color: "var(--gold-deep)", fontWeight: 600, textDecoration: "none" }}>
                    {r.customerName}
                  </Link>
                </td>
                <td>
                  <a
                    href={waLink(r.phone, `Merhaba ${r.customerName}, MEF Organizasyon'dan yazıyoruz.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#3f6b3f", fontWeight: 600, textDecoration: "none" }}
                    title="WhatsApp'tan yaz"
                  >
                    0{formatPhoneDisplay(r.phone)} ↗
                  </a>
                  {r.email ? <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>{r.email}</div> : null}
                </td>
                <td>{new Date(r.eventDate).toLocaleDateString("tr-TR")}</td>
                <td>{r.concept.name}</td>
                <td>{r.guestCount ?? "-"}</td>
                <td>
                  <span className={`badge ${statusClass[r.status]}`}>{statusLabel[r.status]}</span>
                </td>
                <td>
                  {r.status === "PENDING" ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn"
                        style={{ padding: "6px 14px", fontSize: 14 }}
                        disabled={busyId === r.id}
                        onClick={() => handleAction(r.id, "approve")}
                      >
                        Onayla
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: "6px 14px", fontSize: 14 }}
                        disabled={busyId === r.id}
                        onClick={() => handleAction(r.id, "reject")}
                      >
                        Reddet
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: "var(--ink-soft)" }}>-</span>
                  )}
                </td>
              </tr>
            ))}
            {requests?.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-soft)" }}>
                  Kayıt bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
