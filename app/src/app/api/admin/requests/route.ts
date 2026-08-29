import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const requests = await prisma.bookingRequest.findMany({
    where: status ? { status: status as any } : undefined,
    include: { concept: true, booking: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}
