import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date) {
    const concepts = await prisma.concept.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true, subtitle: true, description: true, imageUrl: true },
    });
    return NextResponse.json(concepts);
  }

  const eventDate = new Date(date);
  if (Number.isNaN(eventDate.getTime())) {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  const concepts = await prisma.concept.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: {
      bookings: {
        where: { eventDate },
        select: { id: true },
      },
    },
  });

  const withAvailability = concepts.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    subtitle: c.subtitle,
    imageUrl: c.imageUrl,
    available: c.bookings.length === 0,
  }));

  return NextResponse.json(withAvailability);
}
