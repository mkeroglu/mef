import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const concept = await prisma.concept.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      slug: true,
      name: true,
      subtitle: true,
      description: true,
      imageUrl: true,
      order: true,
      active: true,
    },
  });
  if (!concept) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
  return NextResponse.json(concept);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const contentType = req.headers.get("content-type") || "";
  const data: Record<string, unknown> = {};

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    for (const key of ["name", "subtitle", "description"] as const) {
      const v = form.get(key);
      if (v !== null) data[key] = String(v).trim();
    }
    const orderRaw = form.get("order");
    if (orderRaw !== null) data.order = Number(orderRaw);
    const activeRaw = form.get("active");
    if (activeRaw !== null) data.active = activeRaw === "true";

    const file = form.get("image") as File | null;
    if (file && file.size > 0) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Desteklenmeyen resim formatı (jpeg, png, webp)" }, { status: 400 });
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "Resim 5MB'den küçük olmalı" }, { status: 400 });
      }
      data.imageData = Buffer.from(await file.arrayBuffer());
      data.imageMime = file.type;
      data.imageUrl = `/api/images/concepts/${params.id}`;
    }
  } else {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }
    for (const key of ["name", "subtitle", "description", "active", "order"] as const) {
      if (key in body) data[key] = body[key];
    }
  }

  const updated = await prisma.concept.update({ where: { id: params.id }, data });

  const { imageData: _omit, ...safe } = updated;
  return NextResponse.json(safe);
}
