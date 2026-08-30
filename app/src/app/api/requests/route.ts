import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";
import { sendNewRequestNotification, sendCustomerConfirmation } from "@/lib/mail";

const configSelectionSchema = z.object({
  optionId: z.string().optional(),
  value: z.boolean().optional(),
  note: z.string().max(300).optional(),
});

const requestSchema = z.object({
  gelinAdi: z.string().min(2).max(120),
  damatAdi: z.string().min(2).max(120),
  phone: z.string().regex(/^5\d{9}$/, "Telefon numarası 5XX XXX XXXX formatında olmalı"),
  ikinciIletisim: z.string().min(3).max(60),
  email: z.string().email().optional().or(z.literal("")),
  adres: z.string().min(5).max(500),
  eventDate: z.string(),
  kurulumSaati: z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz saat"),
  organizationType: z.enum(["SOZ", "NISAN", "DUGUN"]),
  asansorVarMi: z.boolean(),
  kat: z.enum(["GIRIS", "KAT1", "KAT2", "KAT3", "KAT4_UZERI"]),
  conceptId: z.string(),
  guestCount: z.number().int().positive().optional(),
  message: z.string().max(1000).optional(),
  configSelections: z.record(configSelectionSchema).optional(),
});

const ORG_TYPE_LABEL: Record<string, string> = { SOZ: "Söz", NISAN: "Nişan", DUGUN: "Düğün" };
const KAT_LABEL: Record<string, string> = {
  GIRIS: "Giriş Kat",
  KAT1: "1. Kat",
  KAT2: "2. Kat",
  KAT3: "3. Kat",
  KAT4_UZERI: "4. Kat ve Üzeri",
};

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowed = await checkRateLimit(`request:${ip}`, 5, 60 * 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Çok fazla talep gönderdiniz. Lütfen daha sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz form verisi", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const eventDate = new Date(data.eventDate);
  if (Number.isNaN(eventDate.getTime())) {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  const concept = await prisma.concept.findUnique({ where: { id: data.conceptId } });
  if (!concept || !concept.active) {
    return NextResponse.json({ error: "Geçersiz konsept" }, { status: 400 });
  }

  const existingBooking = await prisma.booking.findUnique({
    where: { eventDate_conceptId: { eventDate, conceptId: data.conceptId } },
  });
  if (existingBooking) {
    return NextResponse.json(
      { error: "Seçtiğiniz konsept bu tarihte dolu. Lütfen başka bir tarih veya konsept seçin." },
      { status: 409 }
    );
  }

  const activeGroups = await prisma.optionGroup.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: { options: { where: { active: true } } },
  });

  const selections = data.configSelections || {};
  const configSummary: { label: string; value: string }[] = [];

  for (const group of activeGroups) {
    const selection = selections[group.key];

    if (group.type === "SINGLE_SELECT") {
      const option = selection?.optionId ? group.options.find((o) => o.id === selection.optionId) : null;
      if (group.required && !option) {
        return NextResponse.json({ error: `"${group.label}" seçimi zorunlu` }, { status: 400 });
      }
      if (option) configSummary.push({ label: group.label, value: option.label });
    } else {
      if (group.required && selection?.value === undefined) {
        return NextResponse.json({ error: `"${group.label}" için Evet/Hayır seçimi zorunlu` }, { status: 400 });
      }
      if (selection?.value !== undefined) {
        const val = selection.value ? "Evet" + (selection.note ? ` (${selection.note})` : "") : "Hayır";
        configSummary.push({ label: group.label, value: val });
      }
    }
  }

  const customerName = `${data.gelinAdi} & ${data.damatAdi}`;

  const created = await prisma.bookingRequest.create({
    data: {
      customerName,
      gelinAdi: data.gelinAdi,
      damatAdi: data.damatAdi,
      phone: data.phone,
      ikinciIletisim: data.ikinciIletisim,
      email: data.email || null,
      adres: data.adres,
      eventDate,
      kurulumSaati: data.kurulumSaati,
      organizationType: data.organizationType,
      asansorVarMi: data.asansorVarMi,
      kat: data.kat,
      guestCount: data.guestCount,
      message: data.message,
      conceptId: data.conceptId,
      configSelections: selections,
    },
  });

  await sendNewRequestNotification({
    customerName,
    gelinAdi: data.gelinAdi,
    damatAdi: data.damatAdi,
    phone: data.phone,
    ikinciIletisim: data.ikinciIletisim,
    email: data.email || null,
    adres: data.adres,
    eventDate,
    kurulumSaati: data.kurulumSaati,
    organizationTypeLabel: ORG_TYPE_LABEL[data.organizationType],
    asansorVarMi: data.asansorVarMi,
    katLabel: KAT_LABEL[data.kat],
    conceptName: concept.name,
    guestCount: data.guestCount ?? null,
    message: data.message ?? null,
    configSummary,
  });

  if (data.email) {
    await sendCustomerConfirmation({
      customerName,
      email: data.email,
      eventDate,
      conceptName: concept.name,
    });
  }

  return NextResponse.json({ id: created.id }, { status: 201 });
}
