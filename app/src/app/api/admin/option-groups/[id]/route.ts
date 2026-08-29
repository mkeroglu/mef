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
    for (const key of ["label", "helpText"] as const) {
      const v = form.get(key);
      if (v !== null) data[key] = String(v).trim() || null;
    }
    const requiredRaw = form.get("required");
    if (requiredRaw !== null) data.required = requiredRaw === "true";
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
      data.imageUrl = `/api/images/option-groups/${params.id}`;
    }
  } else {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    for (const key of ["label", "helpText", "required", "order", "active"] as const) {
      if (key in body) data[key] = body[key];
    }
  }

  await prisma.optionGroup.update({ where: { id: params.id }, data });
  const safe = await prisma.optionGroup.findUniqueOrThrow({
    where: { id: params.id },
    select: {
      id: true,
      key: true,
      label: true,
      type: true,
      helpText: true,
      imageUrl: true,
      required: true,
      order: true,
      active: true,
      options: {
        orderBy: { order: "asc" },
        select: { id: true, label: true, imageUrl: true, order: true, active: true },
      },
    },
  });
  return NextResponse.json(safe);
}
