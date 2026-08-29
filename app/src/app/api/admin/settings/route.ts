import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";
import { normalizePhoneInput, isValidTrPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  const { smtpPasswordEnc, ...safe } = settings;
  return NextResponse.json({ ...safe, hasSmtpPassword: Boolean(smtpPasswordEnc) });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  let whatsappBusinessNumber: string | null | undefined = body.whatsappBusinessNumber;
  if (typeof whatsappBusinessNumber === "string" && whatsappBusinessNumber.trim() !== "") {
    const normalized = normalizePhoneInput(whatsappBusinessNumber);
    if (!isValidTrPhone(normalized)) {
      return NextResponse.json(
        { error: "WhatsApp numarası 5XX XXX XXXX formatında olmalı" },
        { status: 400 }
      );
    }
    whatsappBusinessNumber = normalized;
  } else if (whatsappBusinessNumber === "") {
    whatsappBusinessNumber = null;
  }

  const updated = await updateSettings({
    smtpHost: body.smtpHost,
    smtpPort: body.smtpPort ? Number(body.smtpPort) : undefined,
    smtpSecure: typeof body.smtpSecure === "boolean" ? body.smtpSecure : undefined,
    smtpUser: body.smtpUser,
    smtpPassword: body.smtpPassword || undefined,
    smtpFromEmail: body.smtpFromEmail,
    smtpFromName: body.smtpFromName,
    notifyToEmail: body.notifyToEmail,
    emailSubjectTemplate: body.emailSubjectTemplate,
    emailBodyTemplate: body.emailBodyTemplate,
    whatsappBusinessNumber,
  });

  const { smtpPasswordEnc, ...safe } = updated;
  return NextResponse.json({ ...safe, hasSmtpPassword: Boolean(smtpPasswordEnc) });
}
