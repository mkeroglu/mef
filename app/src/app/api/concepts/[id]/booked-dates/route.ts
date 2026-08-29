import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: { conceptId: params.id, eventDate: { gte: today } },
    select: { eventDate: true },
    orderBy: { eventDate: "asc" },
  });

  return NextResponse.json(bookings.map((b) => b.eventDate.toISOString().slice(0, 10)));
}
