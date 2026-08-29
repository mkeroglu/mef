"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";

type Settings = {
  smtpHost: string | null;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpFromEmail: string | null;
  smtpFromName: string;
  notifyToEmail: string | null;
  emailSubjectTemplate: string;
  emailBodyTemplate: string;
  whatsappBusinessNumber: string | null;
  hasSmtpPassword: boolean;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [smtpPassword, setSmtpPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [testTo, setTestTo] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [testing, setTesting] = useState(false);

  function load() {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setTestTo(data.notifyToEmail || "");
      });
  }

  useEffect(load, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaveMsg("");
    const payload: Record<string, unknown> = { ...settings };
    delete payload.hasSmtpPassword;
    if (smtpPassword) payload.smtpPassword = smtpPassword;

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setSaveMsg("Ayarlar kaydedildi.");
      setSmtpPassword("");
      load();
    } else {
      setSaveMsg("Kaydedilemedi.");
    }
    setSaving(false);
  }

  async function handleTest() {
    setTesting(true);
    setTestMsg("");
    const res = await fetch("/api/admin/settings/test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: testTo }),
    });
    const data = await res.json().catch(() => ({}));
    setTestMsg(res.ok ? "Test e-postası gönderildi, kutunuzu kontrol edin." : data.error || "Gönderilemedi.");
    setTesting(false);
  }

  if (!settings) {
    return (
      <AdminShell>
        <p>Yükleniyor...</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <h1 className="font-display" style={{ marginTop: 0 }}>
        Ayarlar
      </h1>

      <form onSubmit={handleSave} className="card" style={{ padding: 30, display: "grid", gap: 22 }}>
        <div>
          <h3 className="font-display" style={{ color: "var(--gold-deep)", marginBottom: 14 }}>
            SMTP (E-posta Bildirimleri)
          </h3>
          <p style={{ color: "var(--ink-soft)", fontSize: 15, marginTop: -8, marginBottom: 16 }}>
            Gmail kullanacaksanız SMTP sunucu <code>smtp.gmail.com</code>, port <code>465</code> (güvenli),
            kullanıcı adı Gmail adresiniz, şifre olarak da Google hesabınızdan oluşturduğunuz{" "}
            <strong>Uygulama Şifresi</strong> (normal şifreniz değil) girilmeli.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div>
              <label>SMTP Sunucu</label>
              <input
                value={settings.smtpHost || ""}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <label>Port</label>
              <input
                type="number"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: Number(e.target.value) })}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <div>
              <label>Kullanıcı Adı (Gmail adresi)</label>
              <input
                value={settings.smtpUser || ""}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                placeholder="ornek@gmail.com"
              />
            </div>
            <div>
              <label>
                Şifre (Uygulama Şifresi) {settings.hasSmtpPassword ? "— kayıtlı, değiştirmek için yeni girin" : ""}
              </label>
              <input
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder={settings.hasSmtpPassword ? "••••••••••••••••" : "16 haneli uygulama şifresi"}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
            <input
              type="checkbox"
              id="smtpSecure"
              checked={settings.smtpSecure}
              onChange={(e) => setSettings({ ...settings, smtpSecure: e.target.checked })}
              style={{ width: "auto" }}
            />
            <label htmlFor="smtpSecure" style={{ marginBottom: 0, textTransform: "none" }}>
              SSL/TLS kullan (465 portu için işaretli olmalı, 587 için işaretsiz)
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <div>
              <label>Gönderen Adresi</label>
              <input
                value={settings.smtpFromEmail || ""}
                onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
                placeholder="ornek@gmail.com"
              />
            </div>
            <div>
              <label>Gönderen Adı</label>
              <input
                value={settings.smtpFromName}
                onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label>Bildirimlerin Gideceği E-posta</label>
            <input
              type="email"
              value={settings.notifyToEmail || ""}
              onChange={(e) => setSettings({ ...settings, notifyToEmail: e.target.value })}
              placeholder="bildirimler@ornek.com"
            />
          </div>
        </div>

        <div>
          <h3 className="font-display" style={{ color: "var(--gold-deep)", marginBottom: 14 }}>
            E-posta Şablonu
          </h3>
          <p style={{ color: "var(--ink-soft)", fontSize: 15, marginTop: -8, marginBottom: 16 }}>
            Kullanılabilir alanlar: <code>{"{{customerName}}"}</code> <code>{"{{phone}}"}</code>{" "}
            <code>{"{{email}}"}</code> <code>{"{{eventDate}}"}</code> <code>{"{{concept}}"}</code>{" "}
            <code>{"{{guestCount}}"}</code> <code>{"{{message}}"}</code>
          </p>
          <label>Konu</label>
          <input
            value={settings.emailSubjectTemplate}
            onChange={(e) => setSettings({ ...settings, emailSubjectTemplate: e.target.value })}
          />
          <div style={{ marginTop: 16 }}>
            <label>İçerik</label>
            <textarea
              rows={7}
              value={settings.emailBodyTemplate}
              onChange={(e) => setSettings({ ...settings, emailBodyTemplate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <h3 className="font-display" style={{ color: "var(--gold-deep)", marginBottom: 14 }}>
            WhatsApp
          </h3>
          <label>İşletme WhatsApp Numarası (5XX XXX XXXX)</label>
          <input
            value={settings.whatsappBusinessNumber || ""}
            onChange={(e) => setSettings({ ...settings, whatsappBusinessNumber: e.target.value })}
            placeholder="530 123 4567"
          />
          <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>
            Girilirse sitede sağ altta yüzen bir &quot;WhatsApp&apos;tan Yaz&quot; butonu görünür.
          </p>
        </div>

        {saveMsg && <p style={{ color: "var(--gold-deep)" }}>{saveMsg}</p>}

        <button type="submit" className="btn" disabled={saving} style={{ justifySelf: "start" }}>
          {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
        </button>
      </form>

      <div className="card" style={{ padding: 30, marginTop: 24, display: "grid", gap: 14 }}>
        <h3 className="font-display" style={{ color: "var(--gold-deep)", margin: 0 }}>
          Test E-postası Gönder
        </h3>
        <div style={{ display: "flex", gap: 12 }}>
          <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="test@ornek.com" />
          <button type="button" className="btn btn-outline" onClick={handleTest} disabled={testing || !testTo}>
            {testing ? "Gönderiliyor..." : "Gönder"}
          </button>
        </div>
        {testMsg && <p style={{ color: "var(--ink-soft)" }}>{testMsg}</p>}
      </div>
    </AdminShell>
  );
}
