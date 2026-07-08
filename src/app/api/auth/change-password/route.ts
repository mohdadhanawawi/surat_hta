import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Kata laluan baru sekurang-kurangnya 6 aksara."),
});

export async function POST(request: NextRequest) {
  const currentUser = await requireUser();

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak sah." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: currentUser.userId } });
  if (!user) {
    return NextResponse.json({ error: "Pengguna tidak dijumpai." }, { status: 404 });
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Kata laluan semasa tidak tepat." },
      { status: 401 }
    );
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
