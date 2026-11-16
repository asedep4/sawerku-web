import { getUserByUsername } from "@/lib/db";
import { checkPassword, cleanText, startSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";

export async function POST(req: Request) {
  const body = await readJson(req);
  const username = cleanText(body.username, 20).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const user = await getUserByUsername(username);
  if (!user || !(await checkPassword(password, user.password_hash))) {
    return fail("Username atau password salah.", 401);
  }
  if (!user.active) return fail("Akun ini dinonaktifkan admin.", 403);
  await startSession(user);
  return ok({ ok: true, role: user.role });
}
