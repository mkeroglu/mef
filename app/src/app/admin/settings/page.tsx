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
  customerConfirmSubjectTemplate: string;
  customerConfirmBodyTemplate: string;
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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");

    if (newPassword !== newPasswordConfirm) {
      setPasswordError("Yeni şifreler eşleşmiyor.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Yeni şifre en az 8 karakter olmalı.");
      return;
    }

    setChangingPassword(true);
    const res = await fetch("/api/admin/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      setPasswordMsg("Şifreniz değiştirildi.");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } else {
      const data = await res.json().catch(() => ({}));
      setPasswordError(data.error || "Şifre değiştirilemedi.");
    }
    setChangingPassword(false);
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
          <div className="grid-2">
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
          <div className="grid-2" style={{ marginTop: 16 }}>
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
          <div className="grid-2" style={{ marginTop: 16 }}>
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
            Müşteri Onay E-postası
          </h3>
          <p style={{ color: "var(--ink-soft)", fontSize: 15, marginTop: -8, marginBottom: 16 }}>
            Müşteri talep formunda e-posta bıraktıysa, talebi gönderir göndermez bu mail otomatik gider.
            Kullanılabilir alanlar: <code>{"{{customerName}}"}</code> <code>{"{{eventDate}}"}</code>{" "}
            <code>{"{{concept}}"}</code>
          </p>
          <label>Konu</label>
          <input
            value={settings.customerConfirmSubjectTemplate}
            onChange={(e) => setSettings({ ...settings, customerConfirmSubjectTemplate: e.target.value })}
          />
          <div style={{ marginTop: 16 }}>
            <label>İçerik</label>
            <textarea
              rows={5}
              value={settings.customerConfirmBodyTemplate}
              onChange={(e) => setSettings({ ...settings, customerConfirmBodyTemplate: e.target.value })}
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

      <form onSubmit={handlePasswordChange} className="card" style={{ padding: 30, marginTop: 24, display: "grid", gap: 16, maxWidth: 480 }}>
        <h3 className="font-display" style={{ color: "var(--gold-deep)", margin: 0 }}>
          Şifre Değiştir
        </h3>
        <div>
          <label>Mevcut Şifre</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>
        <div>
          <label>Yeni Şifre</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
        </div>
        <div>
          <label>Yeni Şifre (Tekrar)</label>
          <input type="password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} required minLength={8} />
        </div>
        {passwordError && <p style={{ color: "#a33" }}>{passwordError}</p>}
        {passwordMsg && <p style={{ color: "var(--gold-deep)" }}>{passwordMsg}</p>}
        <button type="submit" className="btn" disabled={changingPassword} style={{ justifySelf: "start" }}>
          {changingPassword ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
        </button>
      </form>
    </AdminShell>
  );
}
