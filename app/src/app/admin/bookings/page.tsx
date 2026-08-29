"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";

type Booking = {
  id: string;
  eventDate: string;
  customerName: string;
  concept: { name: string };
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/bookings")
      .then((r) => r.json())
      .then(setBookings);
  }, []);

  const upcoming = bookings?.filter((b) => new Date(b.eventDate) >= new Date(new Date().toDateString()));

  return (
    <AdminShell>
      <h1 className="font-display" style={{ marginTop: 0 }}>
        Tahsis Edilmiş Tarihler
      </h1>
      <p style={{ color: "var(--ink-soft)" }}>
        Onaylanan talepler burada listelenir; her konsept bir tarihte yalnızca bir müşteriye tahsis edilebilir.
      </p>
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Konsept</th>
              <th>Müşteri</th>
            </tr>
          </thead>
          <tbody>
            {upcoming?.map((b) => (
              <tr key={b.id}>
                <td>{new Date(b.eventDate).toLocaleDateString("tr-TR")}</td>
                <td>{b.concept.name}</td>
                <td>{b.customerName}</td>
              </tr>
            ))}
            {upcoming?.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", color: "var(--ink-soft)" }}>
                  Henüz tahsis edilmiş tarih yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
