import nodemailer from "nodemailer";
import { getSettings, renderTemplate } from "./settings";
import { decryptSecret } from "./crypto";
import { waLink } from "./phone";

async function getTransport() {
  const settings = await getSettings();
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPasswordEnc) {
    return null;
  }
  const password = decryptSecret(settings.smtpPasswordEnc);
  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth: { user: settings.smtpUser, pass: password },
  });
  return { transporter, settings };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailShell(opts: { title: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string }): string {
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `<div style="margin-top:28px;">
           <a href="${opts.ctaUrl}" style="display:inline-block;background:#25D366;color:#ffffff;
              text-decoration:none;padding:14px 30px;border-radius:999px;font-weight:600;font-size:15px;
              font-family:Georgia,'Times New Roman',serif;">
             ${escapeHtml(opts.ctaLabel)}
           </a>
         </div>`
      : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1e2c4;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
      <div style="background:#fffaf1;border:1px solid rgba(184,137,76,0.35);border-radius:18px;padding:36px 32px;">
        <p style="text-transform:uppercase;letter-spacing:.3em;font-size:12px;color:#8a6327;margin:0 0 10px;font-weight:bold;">
          MEF Organizasyon
        </p>
        <h1 style="font-size:23px;color:#3c2c1a;margin:0 0 22px;">${escapeHtml(opts.title)}</h1>
        <div style="font-size:16px;line-height:1.75;color:#3c2c1a;">${opts.bodyHtml}</div>
        ${cta}
        <div style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(184,137,76,0.25);">
          <p style="margin:0;font-size:13px;color:#8a7857;">MEF Organizasyon &middot; Her anınız, özel ve unutulmaz olsun.</p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 14px 6px 0;color:#8a7857;font-size:14px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;color:#3c2c1a;font-size:16px;">${escapeHtml(value)}</td>
  </tr>`;
}

function sectionHeading(title: string): string {
  return `<tr><td colspan="2" style="padding:16px 0 4px;color:#8a6327;font-size:13px;text-transform:uppercase;letter-spacing:.1em;font-weight:bold;border-top:1px solid rgba(184,137,76,0.2);">${escapeHtml(title)}</td></tr>`;
}

function detailRowLink(label: string, linkLabel: string, url: string): string {
  return `<tr>
    <td style="padding:6px 14px 6px 0;color:#8a7857;font-size:14px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;font-size:16px;"><a href="${url}" style="color:#8a6327;text-decoration:underline;">${escapeHtml(linkLabel)}</a></td>
  </tr>`;
}

function googleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export async function sendTestEmail(to: string) {
  const ctx = await getTransport();
  if (!ctx) throw new Error("SMTP ayarları eksik");
  const { transporter, settings } = ctx;
  const html = emailShell({
    title: "Test E-postası",
    bodyHtml: "<p>Bu bir test e-postasıdır. SMTP ayarlarınız doğru çalışıyor. 🎉</p>",
  });
  await transporter.sendMail({
    from: `"${settings.smtpFromName}" <${settings.smtpFromEmail || settings.smtpUser}>`,
    to,
    subject: "MEF Organizasyon - Test E-postası",
    text: "Bu bir test e-postasıdır. SMTP ayarlarınız doğru çalışıyor.",
    html,
  });
}

export async function sendNewRequestNotification(data: {
  customerName: string;
  gelinAdi: string;
  damatAdi: string;
  phone: string;
  ikinciIletisim: string;
  email: string | null;
  adres: string;
  eventDate: Date;
  kurulumSaati: string;
  organizationTypeLabel: string;
  asansorVarMi: boolean;
  katLabel: string;
  conceptName: string;
  guestCount: number | null;
  message: string | null;
  configSummary: { label: string; value: string }[];
}) {
  try {
    const ctx = await getTransport();
    if (!ctx || !ctx.settings.notifyToEmail) return;
    const { transporter, settings } = ctx;
    const notifyToEmail: string = ctx.settings.notifyToEmail;

    const eventDateStr = data.eventDate.toLocaleDateString("tr-TR");
    const vars = {
      customerName: data.customerName,
      phone: `0${data.phone}`,
      email: data.email || "-",
      eventDate: eventDateStr,
      concept: data.conceptName,
      guestCount: data.guestCount ? String(data.guestCount) : "-",
      message: data.message || "-",
    };

    const whatsappUrl = waLink(
      data.phone,
      `Merhaba ${data.customerName}, MEF Organizasyon'dan yazıyoruz. ${eventDateStr} tarihli ${data.conceptName} talebiniz için sizinle iletişime geçmek istedik.`
    );

    const detailsHtml = `<table role="presentation" style="border-collapse:collapse;margin-top:6px;width:100%;">
      ${sectionHeading("Çift ve İletişim")}
      ${detailRow("Gelin", data.gelinAdi)}
      ${detailRow("Damat", data.damatAdi)}
      ${detailRow("Telefon", `0${data.phone}`)}
      ${detailRow("2. İletişim", data.ikinciIletisim)}
      ${detailRow("E-posta", vars.email)}
      ${detailRow("Adres", data.adres)}
      ${detailRowLink("Konum", "Google Maps'te Aç ↗", googleMapsUrl(data.adres))}
      ${sectionHeading("Organizasyon")}
      ${detailRow("Tür", data.organizationTypeLabel)}
      ${detailRow("Tarih", eventDateStr)}
      ${detailRow("Kurulum Saati", data.kurulumSaati)}
      ${detailRow("Kat", data.katLabel)}
      ${detailRow("Asansör", data.asansorVarMi ? "Var" : "Yok")}
      ${detailRow("Konsept", data.conceptName)}
      ${detailRow("Davetli Sayısı", vars.guestCount)}
      ${sectionHeading("Seçimler")}
      ${data.configSummary.map((c) => detailRow(c.label, c.value)).join("")}
      ${sectionHeading("Not")}
      ${detailRow("Not", vars.message)}
    </table>`;

    const customBodyText = renderTemplate(settings.emailBodyTemplate, vars);
    const customBodyHtml = `<p style="margin:0 0 20px;">${escapeHtml(customBodyText).replace(/\n/g, "<br/>")}</p>`;

    const html = emailShell({
      title: "Yeni Organizasyon Talebi",
      bodyHtml: customBodyHtml + detailsHtml,
      ctaLabel: `WhatsApp'tan ${data.customerName}'e Yaz`,
      ctaUrl: whatsappUrl,
    });

    const textLines = [
      customBodyText,
      "",
      `Gelin: ${data.gelinAdi}`,
      `Damat: ${data.damatAdi}`,
      `Telefon: 0${data.phone}`,
      `2. İletişim: ${data.ikinciIletisim}`,
      `Adres: ${data.adres}`,
      `Konum (Google Maps): ${googleMapsUrl(data.adres)}`,
      `Tür: ${data.organizationTypeLabel}`,
      `Tarih: ${eventDateStr}`,
      `Kurulum Saati: ${data.kurulumSaati}`,
      `Kat: ${data.katLabel}`,
      `Asansör: ${data.asansorVarMi ? "Var" : "Yok"}`,
      `Konsept: ${data.conceptName}`,
      ...data.configSummary.map((c) => `${c.label}: ${c.value}`),
      "",
      `WhatsApp'tan yazmak için: ${whatsappUrl}`,
    ];

    await transporter.sendMail({
      from: `"${settings.smtpFromName}" <${settings.smtpFromEmail || settings.smtpUser}>`,
      to: notifyToEmail,
      subject: renderTemplate(settings.emailSubjectTemplate, vars),
      text: textLines.join("\n"),
      html,
    });
  } catch (err) {
    console.error("Bildirim e-postası gönderilemedi:", err);
  }
}

export async function sendCustomerConfirmation(data: {
  customerName: string;
  email: string;
  eventDate: Date;
  conceptName: string;
}) {
  try {
    const ctx = await getTransport();
    if (!ctx) return;
    const { transporter, settings } = ctx;

    const eventDateStr = data.eventDate.toLocaleDateString("tr-TR");
    const vars = {
      customerName: data.customerName,
      eventDate: eventDateStr,
      concept: data.conceptName,
    };

    const bodyText = renderTemplate(settings.customerConfirmBodyTemplate, vars);
    const bodyHtml = `<p style="margin:0;">${escapeHtml(bodyText).replace(/\n/g, "<br/>")}</p>`;

    const whatsappUrl = settings.whatsappBusinessNumber
      ? waLink(settings.whatsappBusinessNumber, `Merhaba, ${eventDateStr} tarihli talebim hakkında bilgi almak istiyorum.`)
      : undefined;

    const html = emailShell({
      title: "Talebiniz Alındı",
      bodyHtml,
      ctaLabel: whatsappUrl ? "WhatsApp'tan Bize Yazın" : undefined,
      ctaUrl: whatsappUrl,
    });

    await transporter.sendMail({
      from: `"${settings.smtpFromName}" <${settings.smtpFromEmail || settings.smtpUser}>`,
      to: data.email,
      subject: renderTemplate(settings.customerConfirmSubjectTemplate, vars),
      text: bodyText + (whatsappUrl ? `\n\nWhatsApp'tan yazmak için: ${whatsappUrl}` : ""),
      html,
    });
  } catch (err) {
    console.error("Müşteri onay e-postası gönderilemedi:", err);
  }
}
