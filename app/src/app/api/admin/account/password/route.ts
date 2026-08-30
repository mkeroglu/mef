import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await getSession(token);
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  const allowed = await checkRateLimit(`password-change:${session.adminId}`, 10, 60 * 10);
  if (!allowed) {
    return NextResponse.json({ error: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = body?.currentPassword as string | undefined;
  const newPassword = body?.newPassword as string | undefined;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Mevcut ve yeni şifre gerekli" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Yeni şifre en az 8 karakter olmalı" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: session.adminId } });
  if (!admin) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Mevcut şifre yanlış" }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
