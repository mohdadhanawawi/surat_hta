import { redirect } from "next/navigation";
import { getSession, type SessionData } from "@/lib/session";

export async function getCurrentUser(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.userId) return null;
  return {
    userId: session.userId,
    name: session.name,
    username: session.username,
    role: session.role,
  };
}

export async function requireUser(): Promise<SessionData> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionData> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
