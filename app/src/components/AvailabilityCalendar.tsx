"use client";

import { useState } from "react";

const WEEKDAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" });

function toLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AvailabilityCalendar({
  value,
  onChange,
  bookedDates,
  loading,
}: {
  value: string;
  onChange: (iso: string) => void;
  bookedDates: string[];
  loading?: boolean;
}) {
  const initial = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookedSet = new Set(bookedDates);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  function goPrevMonth() {
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }
  function goNextMonth() {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  return (
    <div className="card" style={{ padding: 20, maxWidth: 380 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button type="button" onClick={goPrevMonth} className="btn btn-outline" style={{ padding: "4px 14px", fontSize: 16 }}>
          ‹
        </button>
        <span className="font-display" style={{ textTransform: "capitalize", fontSize: 17 }}>
          {MONTH_FORMATTER.format(new Date(viewYear, viewMonth, 1))}
        </span>
        <button type="button" onClick={goNextMonth} className="btn btn-outline" style={{ padding: "4px 14px", fontSize: 16 }}>
          ›
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, fontSize: 12, color: "var(--ink-soft)", marginBottom: 6, textAlign: "center" }}>
        {WEEKDAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <span key={`empty-${i}`} />;
          const iso = toLocalIso(d);
          const isPast = d < today;
          const isBooked = bookedSet.has(iso);
          const isSelected = value === iso;
          const disabled = isPast || isBooked || loading;
          return (
            <button
              type="button"
              key={iso}
              disabled={disabled}
              onClick={() => onChange(iso)}
              title={isBooked ? "Bu tarihte dolu" : undefined}
              style={{
                aspectRatio: "1",
                borderRadius: 8,
                border: isSelected ? "2px solid var(--gold)" : "1px solid rgba(184,137,76,0.2)",
                background: isSelected
                  ? "rgba(184,137,76,0.22)"
                  : isBooked
                  ? "rgba(163,51,51,0.08)"
                  : "rgba(255,250,241,0.9)",
                color: isPast ? "rgba(107,86,54,0.35)" : isBooked ? "#a33" : "var(--ink)",
                textDecoration: isBooked ? "line-through" : "none",
                cursor: disabled ? "not-allowed" : "pointer",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 12, marginBottom: 0, display: "flex", gap: 16 }}>
        <span>
          <span style={{ color: "#a33" }}>■</span> Dolu
        </span>
        <span>
          <span style={{ color: "var(--gold)" }}>■</span> Seçili
        </span>
      </p>
    </div>
  );
}
