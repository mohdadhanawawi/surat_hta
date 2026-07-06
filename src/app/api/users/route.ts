import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

const createUserSchema = z.object({
  name: z.string().min(1, "Nama diperlukan."),
  username: z
    .string()
    .min(3, "Username sekurang-kurangnya 3 aksara.")
    .regex(/^[a-z0-9_.]+$/i, "Username hanya boleh huruf, nombor, titik, garis bawah."),
  password: z.string().min(6, "Kata laluan sekurang-kurangnya 6 aksara."),
  role: z.enum(["ADMIN", "STAFF"]),
});

export async function GET() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak sah." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Username sudah digunakan." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      passwordHash,
      role: parsed.data.role,
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
