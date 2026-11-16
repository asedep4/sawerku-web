import postgres from "postgres";

// ===== Tipe data =====
export type Role = "admin" | "creator";

export interface User {
  id: number;
  username: string;
  display_name: string;
  password_hash: string;
  role: Role;
  api_key: string;
  active: boolean;
  bio: string;
  created_at: string;
}

export interface Message {
  id: number;
  creator_id: number;
  donor_name: string;
  message: string;
  hidden: boolean;
  delivered_at: string | null;
  created_at: string;
  ip_hash: string;
}

export type PublicUser = Omit<User, "password_hash">;

export function toPublic(u: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...rest } = u;
  return rest;
}

// ===== Koneksi =====
// Dengan DATABASE_URL -> Postgres (Supabase/Neon, gratis).
// Tanpa DATABASE_URL -> penyimpanan memori (HANYA untuk tes lokal; hilang saat server mati).
const useMemory = !process.env.DATABASE_URL;

type Sql = ReturnType<typeof postgres>;
const g = globalThis as unknown as {
  __sql?: Sql;
  __schemaReady?: Promise<void>;
  __mem?: { users: User[]; messages: Message[]; uid: number; mid: number };
};

function sql(): Sql {
  if (!g.__sql) {
    g.__sql = postgres(process.env.DATABASE_URL as string, {
      ssl: process.env.DATABASE_URL?.includes("localhost") ? false : "require",
      prepare: false, // wajib untuk pooler Supabase (port 6543) di Vercel
      max: 1,
    });
  }
  return g.__sql;
}

function mem() {
  if (!g.__mem) g.__mem = { users: [], messages: [], uid: 1, mid: 1 };
  return g.__mem;
}

// Tabel dibuat otomatis saat pertama dipakai -> tidak perlu menjalankan SQL manual.
async function ready() {
  if (useMemory) return;
  if (!g.__schemaReady) {
    g.__schemaReady = (async () => {
      const db = sql();
      await db`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          display_name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'creator',
          api_key TEXT UNIQUE NOT NULL,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          bio TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`;
      await db`
        CREATE TABLE IF NOT EXISTS messages (
          id BIGSERIAL PRIMARY KEY,
          creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          donor_name TEXT NOT NULL,
          message TEXT NOT NULL,
          hidden BOOLEAN NOT NULL DEFAULT FALSE,
          delivered_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          ip_hash TEXT NOT NULL DEFAULT ''
        )`;
      await db`CREATE INDEX IF NOT EXISTS messages_creator_idx ON messages (creator_id, id)`;
    })().catch((e) => {
      g.__schemaReady = undefined;
      throw e;
    });
  }
  await g.__schemaReady;
}

const norm = <T>(row: T): T => {
  const r = row as Record<string, unknown>;
  for (const k of ["created_at", "delivered_at"]) {
    if (r[k] instanceof Date) r[k] = (r[k] as Date).toISOString();
  }
  if (typeof r.id === "string") r.id = Number(r.id);
  return row;
};

// ===== Users =====
export async function countAdmins(): Promise<number> {
  if (useMemory) return mem().users.filter((u) => u.role === "admin").length;
  await ready();
  const [r] = await sql()`SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin'`;
  return r.n as number;
}

export async function listUsers(): Promise<(User & { message_count: number })[]> {
  if (useMemory) {
    const m = mem();
    return m.users.map((u) => ({
      ...u,
      message_count: m.messages.filter((x) => x.creator_id === u.id).length,
    }));
  }
  await ready();
  const rows = await sql()`
    SELECT u.*, (SELECT COUNT(*)::int FROM messages m WHERE m.creator_id = u.id) AS message_count
    FROM users u ORDER BY u.id`;
  return rows.map(norm) as unknown as (User & { message_count: number })[];
}

export async function getUserById(id: number): Promise<User | null> {
  if (useMemory) return mem().users.find((u) => u.id === id) ?? null;
  await ready();
  const [r] = await sql()`SELECT * FROM users WHERE id = ${id}`;
  return r ? (norm(r) as unknown as User) : null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const name = username.toLowerCase();
  if (useMemory) return mem().users.find((u) => u.username === name) ?? null;
  await ready();
  const [r] = await sql()`SELECT * FROM users WHERE username = ${name}`;
  return r ? (norm(r) as unknown as User) : null;
}

export async function getUserByApiKey(key: string): Promise<User | null> {
  if (useMemory) return mem().users.find((u) => u.api_key === key) ?? null;
  await ready();
  const [r] = await sql()`SELECT * FROM users WHERE api_key = ${key}`;
  return r ? (norm(r) as unknown as User) : null;
}

export async function createUser(input: {
  username: string;
  display_name: string;
  password_hash: string;
  role: Role;
  api_key: string;
  bio?: string;
}): Promise<User> {
  const username = input.username.toLowerCase();
  if (useMemory) {
    const m = mem();
    if (m.users.some((u) => u.username === username)) throw new Error("USERNAME_TAKEN");
    const u: User = {
      id: m.uid++,
      username,
      display_name: input.display_name,
      password_hash: input.password_hash,
      role: input.role,
      api_key: input.api_key,
      active: true,
      bio: input.bio ?? "",
      created_at: new Date().toISOString(),
    };
    m.users.push(u);
    return u;
  }
  await ready();
  try {
    const [r] = await sql()`
      INSERT INTO users (username, display_name, password_hash, role, api_key, bio)
      VALUES (${username}, ${input.display_name}, ${input.password_hash}, ${input.role}, ${input.api_key}, ${input.bio ?? ""})
      RETURNING *`;
    return norm(r) as unknown as User;
  } catch (e) {
    if ((e as { code?: string }).code === "23505") throw new Error("USERNAME_TAKEN");
    throw e;
  }
}

export type UserPatch = Partial<Pick<User, "username" | "display_name" | "password_hash" | "role" | "api_key" | "active" | "bio">>;

export async function updateUser(id: number, patch: UserPatch): Promise<User | null> {
  if (patch.username) patch.username = patch.username.toLowerCase();
  if (useMemory) {
    const m = mem();
    const u = m.users.find((x) => x.id === id);
    if (!u) return null;
    if (patch.username && m.users.some((x) => x.username === patch.username && x.id !== id)) {
      throw new Error("USERNAME_TAKEN");
    }
    Object.assign(u, patch);
    return u;
  }
  await ready();
  const keys = Object.keys(patch) as (keyof UserPatch)[];
  if (keys.length === 0) return getUserById(id);
  try {
    const db = sql();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [r] = await db`UPDATE users SET ${db(patch as any, keys)} WHERE id = ${id} RETURNING *`;
    return r ? (norm(r) as unknown as User) : null;
  } catch (e) {
    if ((e as { code?: string }).code === "23505") throw new Error("USERNAME_TAKEN");
    throw e;
  }
}

export async function deleteUser(id: number): Promise<void> {
  if (useMemory) {
    const m = mem();
    m.users = m.users.filter((u) => u.id !== id);
    m.messages = m.messages.filter((x) => x.creator_id !== id);
    return;
  }
  await ready();
  await sql()`DELETE FROM users WHERE id = ${id}`;
}

// ===== Messages =====
export async function addMessage(input: {
  creator_id: number;
  donor_name: string;
  message: string;
  ip_hash: string;
}): Promise<Message> {
  if (useMemory) {
    const m = mem();
    const msg: Message = {
      id: m.mid++,
      creator_id: input.creator_id,
      donor_name: input.donor_name,
      message: input.message,
      hidden: false,
      delivered_at: null,
      created_at: new Date().toISOString(),
      ip_hash: input.ip_hash,
    };
    m.messages.push(msg);
    return msg;
  }
  await ready();
  const [r] = await sql()`
    INSERT INTO messages (creator_id, donor_name, message, ip_hash)
    VALUES (${input.creator_id}, ${input.donor_name}, ${input.message}, ${input.ip_hash})
    RETURNING *`;
  return norm(r) as unknown as Message;
}

// jumlah pesan dari satu IP dalam N detik terakhir (anti-spam)
export async function recentCountByIp(ipHash: string, seconds: number): Promise<number> {
  if (useMemory) {
    const since = Date.now() - seconds * 1000;
    return mem().messages.filter((x) => x.ip_hash === ipHash && Date.parse(x.created_at) > since).length;
  }
  await ready();
  const [r] = await sql()`
    SELECT COUNT(*)::int AS n FROM messages
    WHERE ip_hash = ${ipHash} AND created_at > NOW() - (${seconds} * INTERVAL '1 second')`;
  return r.n as number;
}

export async function listMessages(creatorId: number | null, limit = 100): Promise<(Message & { creator_username?: string })[]> {
  if (useMemory) {
    const m = mem();
    return m.messages
      .filter((x) => creatorId === null || x.creator_id === creatorId)
      .sort((a, b) => b.id - a.id)
      .slice(0, limit)
      .map((x) => ({ ...x, creator_username: m.users.find((u) => u.id === x.creator_id)?.username }));
  }
  await ready();
  const rows =
    creatorId === null
      ? await sql()`
          SELECT m.*, u.username AS creator_username FROM messages m
          JOIN users u ON u.id = m.creator_id ORDER BY m.id DESC LIMIT ${limit}`
      : await sql()`
          SELECT m.*, u.username AS creator_username FROM messages m
          JOIN users u ON u.id = m.creator_id WHERE m.creator_id = ${creatorId}
          ORDER BY m.id DESC LIMIT ${limit}`;
  return rows.map(norm) as unknown as (Message & { creator_username?: string })[];
}

export async function getMessage(id: number): Promise<Message | null> {
  if (useMemory) return mem().messages.find((x) => x.id === id) ?? null;
  await ready();
  const [r] = await sql()`SELECT * FROM messages WHERE id = ${id}`;
  return r ? (norm(r) as unknown as Message) : null;
}

export async function setMessageHidden(id: number, hidden: boolean): Promise<void> {
  if (useMemory) {
    const x = mem().messages.find((m) => m.id === id);
    if (x) x.hidden = hidden;
    return;
  }
  await ready();
  await sql()`UPDATE messages SET hidden = ${hidden} WHERE id = ${id}`;
}

export async function deleteMessage(id: number): Promise<void> {
  if (useMemory) {
    const m = mem();
    m.messages = m.messages.filter((x) => x.id !== id);
    return;
  }
  await ready();
  await sql()`DELETE FROM messages WHERE id = ${id}`;
}

// ===== Untuk game Roblox =====
export async function latestMessageId(creatorId: number): Promise<number> {
  if (useMemory) {
    const ids = mem().messages.filter((x) => x.creator_id === creatorId).map((x) => x.id);
    return ids.length ? Math.max(...ids) : 0;
  }
  await ready();
  const [r] = await sql()`SELECT COALESCE(MAX(id), 0)::bigint AS n FROM messages WHERE creator_id = ${creatorId}`;
  return Number(r.n);
}

// Pesan baru setelah id tertentu. Setiap server game menyimpan kursornya sendiri,
// jadi semua server menampilkan pesan yang sama. delivered_at hanya penanda di dashboard.
export async function pullMessages(creatorId: number, afterId: number, limit = 10): Promise<Message[]> {
  if (useMemory) {
    const list = mem()
      .messages.filter((x) => x.creator_id === creatorId && x.id > afterId && !x.hidden)
      .sort((a, b) => a.id - b.id)
      .slice(0, limit);
    const now = new Date().toISOString();
    for (const x of list) if (!x.delivered_at) x.delivered_at = now;
    return list;
  }
  await ready();
  const rows = await sql()`
    SELECT * FROM messages
    WHERE creator_id = ${creatorId} AND id > ${afterId} AND hidden = FALSE
    ORDER BY id ASC LIMIT ${limit}`;
  const list = rows.map(norm) as unknown as Message[];
  const ids = list.filter((x) => !x.delivered_at).map((x) => x.id);
  if (ids.length) await sql()`UPDATE messages SET delivered_at = NOW() WHERE id = ANY(${ids})`;
  return list;
}

export const usingMemoryStore = useMemory;
