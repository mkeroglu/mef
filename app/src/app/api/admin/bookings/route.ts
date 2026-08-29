import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const bookings = await prisma.booking.findMany({
    include: { concept: true },
    orderBy: { eventDate: "asc" },
  });
  return NextResponse.json(bookings);
}
