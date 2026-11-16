import { countAdmins, deleteUser, getUserById, toPublic, updateUser, type UserPatch } from "@/lib/db";
import { cleanText, hashPassword, newApiKey, validUsername } from "@/lib/auth";
import { fail, ok, readJson, requireUser } from "@/lib/http";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

// Admin mengubah user: nama, username, password, role, aktif/nonaktif, API key
export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await requireUser("admin");
  if (admin instanceof NextResponse) return admin;
  const id = Number((await ctx.params).id);
  const target = await getUserById(id);
  if (!target) return fail("User tidak ditemukan.", 404);

  const body = await readJson(req);
  const patch: UserPatch = {};
  if (body.username !== undefined) {
    const u = cleanText(body.username, 20).toLowerCase();
    if (!validUsername(u)) return fail("Username tidak valid.");
    patch.username = u;
  }
  if (body.display_name !== undefined) {
    const d = cleanText(body.display_name, 40);
    if (!d) return fail("Nama tampilan tidak boleh kosong.");
    patch.display_name = d;
  }
  if (body.bio !== undefined) patch.bio = cleanText(body.bio, 160);
  if (body.password !== undefined && body.password !== "") {
    const pw = String(body.password);
    if (pw.length < 8) return fail("Password minimal 8 karakter.");
    patch.password_hash = await hashPassword(pw);
  }
  if (body.role !== undefined) patch.role = body.role === "admin" ? "admin" : "creator";
  if (body.active !== undefined) patch.active = body.active === true;
  if (body.regenerate_key === true) patch.api_key = newApiKey();

  // jangan sampai admin terakhir kehilangan akses
  const losingAdmin = target.role === "admin" && (patch.role === "creator" || patch.active === false);
  if (losingAdmin && (await countAdmins()) <= 1) return fail("Harus ada minimal satu admin aktif.");
  if (target.id === admin.id && patch.active === false) return fail("Tidak bisa menonaktifkan akun sendiri.");

  try {
    const updated = await updateUser(id, patch);
    return ok({ user: updated ? toPublic(updated) : null });
  } catch (e) {
    if ((e as Error).message === "USERNAME_TAKEN") return fail("Username sudah dipakai.", 409);
    throw e;
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const admin = await requireUser("admin");
  if (admin instanceof NextResponse) return admin;
  const id = Number((await ctx.params).id);
  if (id === admin.id) return fail("Tidak bisa menghapus akun sendiri.");
  const target = await getUserById(id);
  if (!target) return fail("User tidak ditemukan.", 404);
  if (target.role === "admin" && (await countAdmins()) <= 1) return fail("Harus ada minimal satu admin.");
  await deleteUser(id);
  return ok();
}
