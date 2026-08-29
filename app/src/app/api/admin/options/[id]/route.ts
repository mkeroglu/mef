import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const contentType = req.headers.get("content-type") || "";
  const data: Record<string, unknown> = {};

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const label = form.get("label");
    if (label !== null) data.label = String(label).trim();
    const orderRaw = form.get("order");
    if (orderRaw !== null) data.order = Number(orderRaw);
    const activeRaw = form.get("active");
    if (activeRaw !== null) data.active = activeRaw === "true";

    const file = form.get("image") as File | null;
    if (file && file.size > 0) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Desteklenmeyen resim formatı" }, { status: 400 });
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "Resim 5MB'den küçük olmalı" }, { status: 400 });
      }
      data.imageData = Buffer.from(await file.arrayBuffer());
      data.imageMime = file.type;
      data.imageUrl = `/api/images/options/${params.id}`;
    }
  } else {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    for (const key of ["label", "order", "active"] as const) {
      if (key in body) data[key] = body[key];
    }
  }

  await prisma.option.update({ where: { id: params.id }, data });
  const safe = await prisma.option.findUniqueOrThrow({
    where: { id: params.id },
    select: { id: true, label: true, imageUrl: true, order: true, active: true },
  });
  return NextResponse.json(safe);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.option.update({ where: { id: params.id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
