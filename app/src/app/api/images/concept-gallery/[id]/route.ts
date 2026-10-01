import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const image = await prisma.conceptImage.findUnique({
    where: { id: params.id },
    select: { imageData: true, imageMime: true },
  });

  if (!image) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(image.imageData), {
    headers: { "Content-Type": image.imageMime || "image/jpeg", "Cache-Control": "public, max-age=86400" },
  });
}
