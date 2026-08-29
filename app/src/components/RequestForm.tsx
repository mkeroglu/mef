"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { normalizePhoneInput, formatPhoneDisplay, isValidTrPhone } from "@/lib/phone";
import AvailabilityCalendar from "./AvailabilityCalendar";

type Concept = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  imageUrl: string;
};

type ConceptAvailability = Concept & {
  available: boolean;
};

type OptionItem = {
  id: string;
  label: string;
  imageUrl: string | null;
};

type OptionGroup = {
  id: string;
  key: string;
  label: string;
  type: "SINGLE_SELECT" | "BOOLEAN";
  helpText: string | null;
  imageUrl: string | null;
  required: boolean;
  options: OptionItem[];
};

const KAT_OPTIONS = [
  { value: "GIRIS", label: "Giriş Kat" },
  { value: "KAT1", label: "1. Kat" },
  { value: "KAT2", label: "2. Kat" },
  { value: "KAT3", label: "3. Kat" },
  { value: "KAT4_UZERI", label: "4. Kat ve Üzeri" },
];

const ORG_TYPE_OPTIONS = [
  { value: "SOZ", label: "Söz" },
  { value: "NISAN", label: "Nişan" },
  { value: "DUGUN", label: "Düğün" },
];

function PickerCard({
  imageUrl,
  label,
  selected,
  disabled,
  disabledText,
  onClick,
}: {
  imageUrl: string | null;
  label: string;
  selected: boolean;
  disabled?: boolean;
  disabledText?: string;
  onClick: () => void;
}) {
  if (!imageUrl) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          padding: "10px 18px",
          borderRadius: 999,
          border: selected ? "2px solid var(--gold)" : "1px solid rgba(184,137,76,0.4)",
          background: selected ? "rgba(184,137,76,0.16)" : "rgba(255,250,241,0.9)",
          color: "var(--ink)",
          fontFamily: "inherit",
          fontSize: 15,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.45 : 1,
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      style={{
        position: "relative",
        padding: 0,
        borderRadius: 14,
        overflow: "hidden",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        background: "rgba(255,250,241,0.9)",
        border: selected ? "3px solid var(--gold)" : "3px solid transparent",
        boxShadow: selected ? "0 12px 24px -12px rgba(138,99,39,0.55)" : "0 8px 18px -14px rgba(60,44,26,0.4)",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        transform: selected ? "translateY(-2px)" : "none",
        textAlign: "left",
        width: 150,
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3" }}>
        <Image src={imageUrl} alt={label} fill style={{ objectFit: "cover" }} sizes="150px" />
        {selected && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "var(--gold)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            }}
          >
            ✓
          </div>
        )}
        {disabled && disabledText && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(60,44,26,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              textAlign: "center",
              padding: 8,
            }}
          >
            {disabledText}
          </div>
        )}
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        <p className="font-display" style={{ margin: 0, fontSize: 14, color: "var(--gold-deep)", lineHeight: 1.25 }}>
          {label}
        </p>
      </div>
    </button>
  );
}

export default function RequestForm() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("konsept");

  const [eventDate, setEventDate] = useState("");
  const [allConcepts, setAllConcepts] = useState<Concept[] | null>(null);
  const [dateFilteredConcepts, setDateFilteredConcepts] = useState<ConceptAvailability[] | null>(null);
  const [conceptId, setConceptId] = useState("");
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loadingBookedDates, setLoadingBookedDates] = useState(false);

  const [groups, setGroups] = useState<OptionGroup[] | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [booleanValues, setBooleanValues] = useState<Record<string, boolean>>({});
  const [booleanNotes, setBooleanNotes] = useState<Record<string, string>>({});

  const [phone, setPhone] = useState("");
  const [asansorVarMi, setAsansorVarMi] = useState<string>("");
  const [organizationType, setOrganizationType] = useState<string>("");
  const [kat, setKat] = useState<string>("");

  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/option-groups")
      .then((r) => r.json())
      .then(setGroups);
  }, []);

  // All active concepts, fetched once — lets the customer pick a concept before a date.
  useEffect(() => {
    fetch("/api/concepts")
      .then((r) => r.json())
      .then((data: Concept[]) => {
        setAllConcepts(data);
        const pre = preselected && data.find((c) => c.slug === preselected);
        if (pre) setConceptId(pre.id);
      });
  }, [preselected]);

  // Once a date is picked, fetch per-concept availability for that date so the
  // concept grid can gray out whichever concept is already taken that day.
  useEffect(() => {
    if (!eventDate) {
      setDateFilteredConcepts(null);
      return;
    }
    setLoadingConcepts(true);
    fetch(`/api/concepts?date=${eventDate}`)
      .then((r) => r.json())
      .then((data: ConceptAvailability[]) => {
        setDateFilteredConcepts(data);
        setConceptId((current) => {
          const stillAvailable = data.find((c) => c.id === current)?.available;
          return stillAvailable === false ? "" : current;
        });
      })
      .finally(() => setLoadingConcepts(false));
  }, [eventDate]);

  // Once a concept is picked, fetch which dates it's already booked on so the
  // calendar can block them — this is the "concept first" flow.
  useEffect(() => {
    if (!conceptId) {
      setBookedDates([]);
      return;
    }
    setLoadingBookedDates(true);
    fetch(`/api/concepts/${conceptId}/booked-dates`)
      .then((r) => r.json())
      .then((dates: string[]) => {
        setBookedDates(dates);
        if (eventDate && dates.includes(eventDate)) setEventDate("");
      })
      .finally(() => setLoadingBookedDates(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptId]);

  const availabilityByConcept = new Map((dateFilteredConcepts || []).map((c) => [c.id, c.available]));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    if (!isValidTrPhone(phone)) {
      setErrorMsg("Telefon numarasını 5XX XXX XXXX formatında girin.");
      setStatus("error");
      return;
    }
    if (!conceptId) {
      setErrorMsg("Lütfen bir konsept seçin.");
      setStatus("error");
      return;
    }
    if (!eventDate) {
      setErrorMsg("Lütfen kurulum tarihi seçin.");
      setStatus("error");
      return;
    }
    if (!organizationType) {
      setErrorMsg("Lütfen organizasyon tercihinizi seçin.");
      setStatus("error");
      return;
    }
    if (!asansorVarMi) {
      setErrorMsg("Lütfen asansör durumunu belirtin.");
      setStatus("error");
      return;
    }
    if (!kat) {
      setErrorMsg("Lütfen kaçıncı kat olduğunu seçin.");
      setStatus("error");
      return;
    }
    for (const g of groups || []) {
      if (!g.required) continue;
      if (g.type === "SINGLE_SELECT" && !selectedOptions[g.key]) {
        setErrorMsg(`Lütfen "${g.label}" seçimini yapın.`);
        setStatus("error");
        return;
      }
      if (g.type === "BOOLEAN" && booleanValues[g.key] === undefined) {
        setErrorMsg(`Lütfen "${g.label}" için Evet/Hayır seçin.`);
        setStatus("error");
        return;
      }
    }

    const form = new FormData(e.currentTarget);

    const configSelections: Record<string, { optionId?: string; value?: boolean; note?: string }> = {};
    for (const g of groups || []) {
      if (g.type === "SINGLE_SELECT" && selectedOptions[g.key]) {
        configSelections[g.key] = { optionId: selectedOptions[g.key] };
      } else if (g.type === "BOOLEAN" && booleanValues[g.key] !== undefined) {
        configSelections[g.key] = { value: booleanValues[g.key], note: booleanNotes[g.key] || undefined };
      }
    }

    const payload = {
      gelinAdi: String(form.get("gelinAdi") || ""),
      damatAdi: String(form.get("damatAdi") || ""),
      phone,
      ikinciIletisim: String(form.get("ikinciIletisim") || ""),
      email: String(form.get("email") || ""),
      adres: String(form.get("adres") || ""),
      eventDate,
      kurulumSaati: String(form.get("kurulumSaati") || ""),
      organizationType,
      asansorVarMi: asansorVarMi === "true",
      kat,
      conceptId,
      guestCount: form.get("guestCount") ? Number(form.get("guestCount")) : undefined,
      message: String(form.get("message") || ""),
      configSelections,
    };

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setStatus("done");
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error || "Bir hata oluştu. Lütfen tekrar deneyin.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <h2 className="font-display" style={{ color: "var(--gold-deep)" }}>
          Talebiniz Alındı
        </h2>
        <p style={{ color: "var(--ink-soft)" }}>
          En kısa sürede sizinle iletişime geçeceğiz. Bizi tercih ettiğiniz için teşekkür ederiz.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: 36, display: "grid", gap: 28 }}>
      <div>
        <h3 className="font-display" style={{ color: "var(--gold-deep)", margin: "0 0 16px" }}>
          Çift Bilgileri
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label htmlFor="gelinAdi">Gelin Adı Soyadı</label>
            <input id="gelinAdi" name="gelinAdi" required minLength={2} />
          </div>
          <div>
            <label htmlFor="damatAdi">Damat Adı Soyadı</label>
            <input id="damatAdi" name="damatAdi" required minLength={2} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-display" style={{ color: "var(--gold-deep)", margin: "0 0 16px" }}>
          İletişim ve Adres
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label htmlFor="phone">Telefon</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--ink-soft)", fontSize: 17 }}>+90</span>
              <input
                id="phone"
                inputMode="numeric"
                autoComplete="tel-national"
                required
                placeholder="530 123 4567"
                value={formatPhoneDisplay(phone)}
                onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label htmlFor="ikinciIletisim">2. İletişim (yakınınız/planör vb.)</label>
            <input id="ikinciIletisim" name="ikinciIletisim" required minLength={3} placeholder="Ad Soyad - Telefon" />
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <label htmlFor="adres">Organizasyon Adresi</label>
          <textarea id="adres" name="adres" rows={2} required minLength={5} placeholder="Salon adı, ilçe, açık adres" />
        </div>
        <div style={{ marginTop: 20 }}>
          <label htmlFor="email">E-posta (opsiyonel)</label>
          <input id="email" name="email" type="email" />
        </div>
      </div>

      <div>
        <h3 className="font-display" style={{ color: "var(--gold-deep)", margin: "0 0 6px" }}>
          Konsept Seçimi
        </h3>
        <p style={{ color: "var(--ink-soft)", fontSize: 15, margin: "0 0 10px" }}>
          Her konseptten yalnızca 1 tane bulunuyor. Önce bir konsept seçip müsait tarihlerini
          takvimde görebilir, ya da önce tarih seçip o tarihte hangi konseptin uygun olduğunu
          görebilirsiniz.
        </p>

        {!allConcepts && <p style={{ color: "var(--ink-soft)", fontSize: 16 }}>Yükleniyor...</p>}

        {allConcepts && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14, marginTop: 10 }}>
            {allConcepts.map((c) => {
              const available = eventDate ? availabilityByConcept.get(c.id) !== false : true;
              return (
                <PickerCard
                  key={c.id}
                  imageUrl={c.imageUrl}
                  label={c.name}
                  selected={conceptId === c.id}
                  disabled={eventDate ? !available : false}
                  disabledText="Bu tarihte dolu"
                  onClick={() => setConceptId(c.id)}
                />
              );
            })}
          </div>
        )}
        {loadingConcepts && <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 8 }}>Uygunluk kontrol ediliyor...</p>}
      </div>

      <div>
        <h3 className="font-display" style={{ color: "var(--gold-deep)", margin: "0 0 6px" }}>
          İstenilen Kurulum Tarihi
        </h3>
        {conceptId ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 15, margin: "0 0 10px" }}>
            {loadingBookedDates
              ? "Seçtiğiniz konseptin dolu tarihleri kontrol ediliyor..."
              : "Seçtiğiniz konsept için dolu tarihler takvimde kırmızı görünüyor."}
          </p>
        ) : (
          <p style={{ color: "var(--ink-soft)", fontSize: 15, margin: "0 0 10px" }}>
            Bir konsept seçerseniz o konseptin dolu tarihlerini burada görebilirsiniz.
          </p>
        )}
        <AvailabilityCalendar value={eventDate} onChange={setEventDate} bookedDates={bookedDates} loading={loadingBookedDates} />
      </div>

      <div>
        <h3 className="font-display" style={{ color: "var(--gold-deep)", margin: "0 0 16px" }}>
          Organizasyon Detayları
        </h3>
        <div style={{ marginBottom: 20, maxWidth: 220 }}>
          <label htmlFor="kurulumSaati">İstenilen Kurulum Saati</label>
          <input id="kurulumSaati" name="kurulumSaati" type="time" required />
        </div>

        <div>
          <label>Organizasyon Tercihi</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {ORG_TYPE_OPTIONS.map((o) => (
              <PickerCard
                key={o.value}
                imageUrl={null}
                label={o.label}
                selected={organizationType === o.value}
                onClick={() => setOrganizationType(o.value)}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
          <div>
            <label>Asansör Var mı?</label>
            <div style={{ display: "flex", gap: 10 }}>
              <PickerCard imageUrl={null} label="Var" selected={asansorVarMi === "true"} onClick={() => setAsansorVarMi("true")} />
              <PickerCard imageUrl={null} label="Yok" selected={asansorVarMi === "false"} onClick={() => setAsansorVarMi("false")} />
            </div>
          </div>
          <div>
            <label htmlFor="kat">Kaçıncı Kat</label>
            <select id="kat" value={kat} onChange={(e) => setKat(e.target.value)} required>
              <option value="">Seçin</option>
              {KAT_OPTIONS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label htmlFor="guestCount">Davetli Sayısı (opsiyonel)</label>
          <input id="guestCount" name="guestCount" type="number" min={1} style={{ maxWidth: 200 }} />
        </div>
      </div>

      {groups?.map((g) => (
        <div key={g.id}>
          <h3 className="font-display" style={{ color: "var(--gold-deep)", margin: "0 0 6px" }}>
            {g.label}
            {!g.required && <span style={{ fontSize: 13, color: "var(--ink-soft)", fontFamily: "inherit" }}> (opsiyonel)</span>}
          </h3>
          {g.helpText && <p style={{ color: "var(--ink-soft)", fontSize: 15, margin: "0 0 10px" }}>{g.helpText}</p>}

          {g.type === "SINGLE_SELECT" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10 }}>
              {g.options.map((o) => (
                <PickerCard
                  key={o.id}
                  imageUrl={o.imageUrl}
                  label={o.label}
                  selected={selectedOptions[g.key] === o.id}
                  onClick={() => setSelectedOptions((prev) => ({ ...prev, [g.key]: o.id }))}
                />
              ))}
            </div>
          )}

          {g.type === "BOOLEAN" && (
            <div>
              {g.imageUrl && (
                <div style={{ position: "relative", width: 180, aspectRatio: "4/3", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
                  <Image src={g.imageUrl} alt={g.label} fill style={{ objectFit: "cover" }} sizes="180px" />
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <PickerCard imageUrl={null} label="Evet" selected={booleanValues[g.key] === true} onClick={() => setBooleanValues((p) => ({ ...p, [g.key]: true }))} />
                <PickerCard imageUrl={null} label="Hayır" selected={booleanValues[g.key] === false} onClick={() => setBooleanValues((p) => ({ ...p, [g.key]: false }))} />
              </div>
              {booleanValues[g.key] === true && (
                <input
                  style={{ marginTop: 10, maxWidth: 360 }}
                  placeholder="Not (örn. adet, tercih)"
                  value={booleanNotes[g.key] || ""}
                  onChange={(e) => setBooleanNotes((p) => ({ ...p, [g.key]: e.target.value }))}
                />
              )}
            </div>
          )}
        </div>
      ))}

      <div>
        <label htmlFor="message">Notunuz (opsiyonel)</label>
        <textarea id="message" name="message" rows={4} />
      </div>

      {errorMsg && <p style={{ color: "#a33" }}>{errorMsg}</p>}

      <button type="submit" className="btn" disabled={status === "submitting"}>
        {status === "submitting" ? "Gönderiliyor..." : "Talebi Gönder"}
      </button>
    </form>
  );
}
