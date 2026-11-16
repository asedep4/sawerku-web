import { countAdmins, createUser } from "@/lib/db";
import { cleanText, hashPassword, newApiKey, startSession, validUsername } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";

// Membuat akun ADMIN pertama. Hanya bisa dipakai sekali (saat belum ada admin).
export async function POST(req: Request) {
  if ((await countAdmins()) > 0) return fail("Admin sudah ada. Silakan login.", 403);
  const body = await readJson(req);
  const username = cleanText(body.username, 20).toLowerCase();
  const display = cleanText(body.display_name, 40) || username;
  const password = typeof body.password === "string" ? body.password : "";
  if (!validUsername(username)) return fail("Username 3-20 karakter: huruf kecil, angka, _ (bukan kata khusus).");
  if (password.length < 8) return fail("Password minimal 8 karakter.");
  const user = await createUser({
    username,
    display_name: display,
    password_hash: await hashPassword(password),
    role: "admin",
    api_key: newApiKey(),
  });
  await startSession(user);
  return ok({ ok: true });
}
