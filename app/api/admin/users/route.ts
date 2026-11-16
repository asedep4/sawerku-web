import { createUser, listUsers, toPublic } from "@/lib/db";
import { cleanText, hashPassword, newApiKey, validUsername } from "@/lib/auth";
import { fail, ok, readJson, requireUser } from "@/lib/http";
import { NextResponse } from "next/server";

export async function GET() {
  const admin = await requireUser("admin");
  if (admin instanceof NextResponse) return admin;
  const users = await listUsers();
  return ok({ users: users.map((u) => ({ ...toPublic(u), message_count: u.message_count })) });
}

// Admin menambah user baru
export async function POST(req: Request) {
  const admin = await requireUser("admin");
  if (admin instanceof NextResponse) return admin;
  const body = await readJson(req);
  const username = cleanText(body.username, 20).toLowerCase();
  const display = cleanText(body.display_name, 40) || username;
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role === "admin" ? "admin" : "creator";
  if (!validUsername(username)) return fail("Username 3-20 karakter: huruf kecil, angka, _ (bukan kata khusus).");
  if (password.length < 8) return fail("Password minimal 8 karakter.");
  try {
    const user = await createUser({
      username,
      display_name: display,
      password_hash: await hashPassword(password),
      role,
      api_key: newApiKey(),
      bio: cleanText(body.bio, 160),
    });
    return ok({ user: toPublic(user) }, 201);
  } catch (e) {
    if ((e as Error).message === "USERNAME_TAKEN") return fail("Username sudah dipakai.", 409);
    throw e;
  }
}
