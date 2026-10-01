import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { imageId: string } }) {
  await prisma.conceptImage.delete({ where: { id: params.imageId } });
  return NextResponse.json({ ok: true });
}
