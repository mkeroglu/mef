import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const groups = await prisma.optionGroup.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      key: true,
      label: true,
      type: true,
      helpText: true,
      imageUrl: true,
      required: true,
      options: {
        where: { active: true },
        orderBy: { order: "asc" },
        select: { id: true, label: true, imageUrl: true },
      },
    },
  });
  return NextResponse.json(groups);
}
