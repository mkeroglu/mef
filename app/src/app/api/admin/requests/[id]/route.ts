import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ORG_TYPE_LABEL: Record<string, string> = {
  SOZ: "Söz",
  NISAN: "Nişan",
  DUGUN: "Düğün",
  KINA: "Kına",
  DOGUM_GUNU: "Doğum Günü",
  BRIDE_TO_BE: "Bride to Be",
  DIGER: "Diğer",
};
const KAT_LABEL: Record<string, string> = {
  GIRIS: "Giriş Kat",
  KAT1: "1. Kat",
  KAT2: "2. Kat",
  KAT3: "3. Kat",
  KAT4_UZERI: "4. Kat ve Üzeri",
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const bookingRequest = await prisma.bookingRequest.findUnique({
    where: { id: params.id },
    include: { concept: true, booking: true },
  });
  if (!bookingRequest) {
    return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
  }

  const groups = await prisma.optionGroup.findMany({ include: { options: true }, orderBy: { order: "asc" } });
  const selections = (bookingRequest.configSelections as Record<string, { optionId?: string; value?: boolean; note?: string }>) || {};

  const configSummary = groups
    .filter((g) => selections[g.key])
    .map((g) => {
      const sel = selections[g.key];
      if (g.type === "SINGLE_SELECT") {
        const opt = g.options.find((o) => o.id === sel.optionId);
        return { label: g.label, value: opt ? opt.label : "-" };
      }
      return { label: g.label, value: sel.value ? "Evet" + (sel.note ? ` (${sel.note})` : "") : "Hayır" };
    });

  return NextResponse.json({
    ...bookingRequest,
    organizationTypeLabel: bookingRequest.organizationType ? ORG_TYPE_LABEL[bookingRequest.organizationType] : null,
    katLabel: bookingRequest.kat ? KAT_LABEL[bookingRequest.kat] : null,
    configSummary,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const action = body?.action as "approve" | "reject" | undefined;

  const bookingRequest = await prisma.bookingRequest.findUnique({ where: { id: params.id } });
  if (!bookingRequest) {
    return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
  }
  if (bookingRequest.status !== "PENDING") {
    return NextResponse.json({ error: "Bu talep zaten işlendi" }, { status: 409 });
  }

  if (action === "reject") {
    const updated = await prisma.bookingRequest.update({
      where: { id: params.id },
      data: { status: "REJECTED" },
    });
    return NextResponse.json(updated);
  }

  if (action === "approve") {
    try {
      const [updated] = await prisma.$transaction([
        prisma.bookingRequest.update({
          where: { id: params.id },
          data: { status: "APPROVED" },
        }),
        prisma.booking.create({
          data: {
            eventDate: bookingRequest.eventDate,
            conceptId: bookingRequest.conceptId,
            customerName: bookingRequest.customerName,
            bookingRequestId: bookingRequest.id,
          },
        }),
      ]);
      return NextResponse.json(updated);
    } catch (err: any) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { error: "Bu konsept, bu tarihte başka bir müşteriye tahsis edilmiş." },
          { status: 409 }
        );
      }
      throw err;
    }
  }

  return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
}
