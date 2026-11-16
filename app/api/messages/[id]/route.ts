import { deleteMessage, getMessage, setMessageHidden } from "@/lib/db";
import { fail, ok, readJson, requireUser } from "@/lib/http";
import { NextResponse } from "next/server";

// Pemilik pesan (kreator) atau admin boleh menyembunyikan / menghapus pesan
async function guard(idParam: string) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const msg = await getMessage(Number(idParam));
  if (!msg) return fail("Pesan tidak ditemukan.", 404);
  if (user.role !== "admin" && msg.creator_id !== user.id) return fail("Bukan pesan kamu.", 403);
  return msg;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const msg = await guard(id);
  if (msg instanceof NextResponse) return msg;
  const body = await readJson(req);
  await setMessageHidden(msg.id, body.hidden === true);
  return ok();
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const msg = await guard(id);
  if (msg instanceof NextResponse) return msg;
  await deleteMessage(msg.id);
  return ok();
}
