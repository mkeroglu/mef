import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function GET() {
  const concepts = await prisma.concept.findMany({
    orderBy: { order: "asc" },
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
  return NextResponse.json(concepts);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get("name") || "").trim();
  const subtitle = String(form.get("subtitle") || "").trim();
  const description = String(form.get("description") || "").trim();
  const order = Number(form.get("order") || 0);
  const file = form.get("image") as File | null;

  if (!name || !subtitle || !description) {
    return NextResponse.json({ error: "Ad, alt başlık ve açıklama zorunlu" }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Konsept görseli zorunlu" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Desteklenmeyen resim formatı (jpeg, png, webp)" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Resim 5MB'den küçük olmalı" }, { status: 400 });
  }

  let slug = slugify(name) || "konsept";
  let attempt = 2;
  while (await prisma.concept.findUnique({ where: { slug } })) {
    slug = `${slugify(name)}-${attempt++}`;
  }

  const imageData = Buffer.from(await file.arrayBuffer());

  const created = await prisma.concept.create({
    data: {
      slug,
      name,
      subtitle,
      description,
      order,
      imageUrl: "",
      imageData,
      imageMime: file.type,
    },
  });

  const updated = await prisma.concept.update({
    where: { id: created.id },
    data: { imageUrl: `/api/images/concepts/${created.id}` },
  });

  await redis.del("mef:concepts:active");

  const { imageData: _omit, ...safe } = updated;
  return NextResponse.json(safe, { status: 201 });
}
