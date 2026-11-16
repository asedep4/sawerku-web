import { addMessage, getUserByUsername, recentCountByIp } from "@/lib/db";
import { cleanText, hashIp } from "@/lib/auth";
import { clientIp, fail, ok, readJson } from "@/lib/http";

// Username Roblox: 3-20 karakter, huruf/angka/underscore
const ROBLOX_NAME = /^[A-Za-z0-9_]{3,20}$/;

export async function POST(req: Request) {
  const body = await readJson(req);
  const slug = cleanText(body.slug, 20).toLowerCase();
  const name = cleanText(body.name, 20);
  const message = cleanText(body.message, 150);

  if (!ROBLOX_NAME.test(name)) return fail("Username Roblox tidak valid (3-20 huruf, angka, atau _).");
  if (message.length < 2) return fail("Kata-katanya masih kosong.");

  const creator = await getUserByUsername(slug);
  if (!creator || !creator.active) return fail("Halaman tidak ditemukan.", 404);

  // anti-spam: 1 pesan / 20 detik dan maks 15 pesan / jam per perangkat
  const ip = hashIp(clientIp(req));
  if ((await recentCountByIp(ip, 20)) >= 1) return fail("Tunggu sebentar sebelum mengirim lagi.", 429);
  if ((await recentCountByIp(ip, 3600)) >= 15) return fail("Batas pesan per jam tercapai.", 429);

  await addMessage({ creator_id: creator.id, donor_name: name, message, ip_hash: ip });
  return ok({ ok: true });
}
