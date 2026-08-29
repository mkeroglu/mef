import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const option = await prisma.option.findUnique({
    where: { id: params.id },
    select: { imageData: true, imageMime: true },
  });
  if (!option?.imageData) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(option.imageData), {
    headers: { "Content-Type": option.imageMime || "image/jpeg", "Cache-Control": "public, max-age=86400" },
  });
}
