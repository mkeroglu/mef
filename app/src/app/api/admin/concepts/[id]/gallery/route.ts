import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const images = await prisma.conceptImage.findMany({
    where: { conceptId: params.id },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });
  return NextResponse.json(images);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData();
  const files = form.getAll("images") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "En az bir görsel seçin" }, { status: 400 });
  }

  const last = await prisma.conceptImage.findFirst({
    where: { conceptId: params.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  let order = (last?.order ?? -1) + 1;

  const created = [];
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Desteklenmeyen resim formatı (jpeg, png, webp)" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Her resim 5MB'den küçük olmalı" }, { status: 400 });
    }
    const imageData = Buffer.from(await file.arrayBuffer());
    const row = await prisma.conceptImage.create({
      data: { conceptId: params.id, imageData, imageMime: file.type, order: order++ },
      select: { id: true, order: true },
    });
    created.push(row);
  }

  return NextResponse.json(created, { status: 201 });
}
