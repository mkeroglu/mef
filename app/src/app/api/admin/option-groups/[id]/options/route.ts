import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData();
  const label = String(form.get("label") || "").trim();
  const order = Number(form.get("order") || 0);
  const file = form.get("image") as File | null;

  if (!label) {
    return NextResponse.json({ error: "Seçenek adı zorunlu" }, { status: 400 });
  }

  const data: Record<string, unknown> = { groupId: params.id, label, order };

  if (file && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Desteklenmeyen resim formatı" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Resim 5MB'den küçük olmalı" }, { status: 400 });
    }
    data.imageData = Buffer.from(await file.arrayBuffer());
    data.imageMime = file.type;
  }

  const created = await prisma.option.create({ data: data as any });
  if (file && file.size > 0) {
    await prisma.option.update({ where: { id: created.id }, data: { imageUrl: `/api/images/options/${created.id}` } });
  }

  const safe = await prisma.option.findUniqueOrThrow({
    where: { id: created.id },
    select: { id: true, label: true, imageUrl: true, order: true, active: true },
  });
  return NextResponse.json(safe, { status: 201 });
}
