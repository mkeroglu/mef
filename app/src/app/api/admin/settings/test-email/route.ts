import { NextRequest, NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const to = body?.to as string | undefined;
  if (!to) {
    return NextResponse.json({ error: "Test e-postası gönderilecek adres gerekli" }, { status: 400 });
  }

  try {
    await sendTestEmail(to);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gönderilemedi" }, { status: 500 });
  }
}
