import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function GET() {
  const groups = await prisma.optionGroup.findMany({
    orderBy: { order: "asc" },
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
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const label = String(form.get("label") || "").trim();
  const type = String(form.get("type") || "SINGLE_SELECT");
  const helpText = String(form.get("helpText") || "").trim() || null;
  const required = form.get("required") === "true";
  const order = Number(form.get("order") || 0);
  const file = form.get("image") as File | null;

  if (!label) {
    return NextResponse.json({ error: "Grup adı zorunlu" }, { status: 400 });
  }
  if (type !== "SINGLE_SELECT" && type !== "BOOLEAN") {
    return NextResponse.json({ error: "Geçersiz tip" }, { status: 400 });
  }

  let key = slugify(label) || "grup";
  let attempt = 2;
  while (await prisma.optionGroup.findUnique({ where: { key } })) {
    key = `${slugify(label)}-${attempt++}`;
  }

  const data: Record<string, unknown> = { key, label, type, helpText, required, order };

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

  const created = await prisma.optionGroup.create({ data: data as any });
  if (file && file.size > 0) {
    await prisma.optionGroup.update({ where: { id: created.id }, data: { imageUrl: `/api/images/option-groups/${created.id}` } });
  }

  const { imageData: _omit, ...safe } = await prisma.optionGroup.findUniqueOrThrow({ where: { id: created.id } });
  return NextResponse.json(safe, { status: 201 });
}
