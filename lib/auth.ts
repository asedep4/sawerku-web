import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getUserById, type User } from "./db";

const COOKIE = "sawerku_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET belum diisi (minimal 32 karakter) di Environment Variables.");
    }
    return new TextEncoder().encode("dev-only-secret-ganti-di-produksi-0123456789");
  }
  return new TextEncoder().encode(s);
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const checkPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);
export const newApiKey = () => "swk_" + crypto.randomBytes(24).toString("hex");
export const hashIp = (ip: string) =>
  crypto.createHash("sha256").update(ip + "|" + (process.env.AUTH_SECRET ?? "dev")).digest("hex").slice(0, 32);

export async function startSession(user: User) {
  const token = await new SignJWT({ uid: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

// User yang sedang login (null jika belum login / akun dinonaktifkan)
export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const user = await getUserById(Number(payload.uid));
    if (!user || !user.active) return null;
    return user;
  } catch {
    return null;
  }
}

// ===== Validasi input =====
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const RESERVED = new Set(["admin", "login", "logout", "dashboard", "setup", "api", "_next", "favicon.ico"]);

export function validUsername(u: unknown): u is string {
  return typeof u === "string" && USERNAME_RE.test(u.toLowerCase()) && !RESERVED.has(u.toLowerCase());
}

export function cleanText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  // buang karakter kontrol & spasi berlebih
  return v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
