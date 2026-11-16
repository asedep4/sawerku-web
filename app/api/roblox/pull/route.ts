import { getUserByApiKey, latestMessageId, pullMessages } from "@/lib/db";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

// Dipanggil server game Roblox (HttpService) setiap beberapa detik.
//   GET /api/roblox/pull            -> { latestId }  (dipanggil sekali saat server game mulai)
//   GET /api/roblox/pull?after=123  -> { latestId, messages: [...] }
// Header wajib: x-api-key: <API key kreator dari dashboard>
export async function GET(req: Request) {
  const key = req.headers.get("x-api-key") ?? "";
  if (!key.startsWith("swk_")) return fail("API key tidak ada.", 401);
  const creator = await getUserByApiKey(key);
  if (!creator || !creator.active) return fail("API key salah atau akun nonaktif.", 401);

  const afterParam = new URL(req.url).searchParams.get("after");
  if (afterParam === null) {
    return ok({ latestId: await latestMessageId(creator.id), messages: [] });
  }
  const after = Math.max(0, Number(afterParam) || 0);
  const list = await pullMessages(creator.id, after, 10);
  return ok({
    latestId: list.length ? list[list.length - 1].id : after,
    messages: list.map((m) => ({ id: m.id, name: m.donor_name, message: m.message, at: m.created_at })),
  });
}
