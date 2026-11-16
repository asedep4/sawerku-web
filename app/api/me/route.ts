import { updateUser, type UserPatch } from "@/lib/db";
import { checkPassword, cleanText, hashPassword, newApiKey } from "@/lib/auth";
import { fail, ok, readJson, requireUser } from "@/lib/http";
import { NextResponse } from "next/server";

// Kreator mengubah profil sendiri / ganti password / buat API key baru
export async function PATCH(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const body = await readJson(req);
  const patch: UserPatch = {};

  if (body.display_name !== undefined) {
    const d = cleanText(body.display_name, 40);
    if (!d) return fail("Nama tampilan tidak boleh kosong.");
    patch.display_name = d;
  }
  if (body.bio !== undefined) patch.bio = cleanText(body.bio, 160);
  if (body.new_password !== undefined) {
    const np = String(body.new_password);
    if (np.length < 8) return fail("Password baru minimal 8 karakter.");
    if (!(await checkPassword(String(body.old_password ?? ""), user.password_hash))) {
      return fail("Password lama salah.", 401);
    }
    patch.password_hash = await hashPassword(np);
  }
  if (body.regenerate_key === true) patch.api_key = newApiKey();

  const updated = await updateUser(user.id, patch);
  return ok({ ok: true, api_key: updated?.api_key });
}
