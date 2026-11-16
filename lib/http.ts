import { NextResponse } from "next/server";
import { currentUser } from "./auth";
import type { User } from "./db";

export const ok = (data: unknown = { ok: true }, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const j = await req.json();
    return j && typeof j === "object" ? (j as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// Melindungi route: kembalikan user, atau respons error
export async function requireUser(role?: "admin"): Promise<User | NextResponse> {
  const user = await currentUser();
  if (!user) return fail("Silakan login dulu.", 401);
  if (role === "admin" && user.role !== "admin") return fail("Khusus admin.", 403);
  return user;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip")) ?? "local";
}
