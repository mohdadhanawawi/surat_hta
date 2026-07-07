import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
  email: z.string().email("Format emel tidak sah.").optional().or(z.literal("")),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak sah." },
      { status: 400 }
    );
  }

  if (
    id === admin.userId &&
    (parsed.data.isActive !== undefined || parsed.data.password)
  ) {
    return NextResponse.json(
      { error: "Tidak boleh mengubah status atau kata laluan akaun sendiri di sini." },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.password) {
    data.passwordHash = await hashPassword(parsed.data.password);
  }
  if (parsed.data.email !== undefined) data.email = parsed.data.email || null;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user });
}
