"use client";

import { useState } from "react";
import type { Message, PublicUser } from "@/lib/db";
import { Sparkle } from "./Decor";
import MessageList from "./MessageList";

export default function Dashboard({
  user,
  origin,
  initialMessages,
}: {
  user: PublicUser;
  origin: string;
  initialMessages: Message[];
}) {
  const [apiKey, setApiKey] = useState(user.api_key);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState("");
  const [profile, setProfile] = useState({ display_name: user.display_name, bio: user.bio });
  const [pw, setPw] = useState({ old_password: "", new_password: "" });
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const link = `${origin}/${user.username}`;

  async function copy(text: string, what: string) {
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(""), 1500);
  }

  async function patch(body: Record<string, unknown>, okText: string) {
    setNotice(null);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotice({ type: "error", text: data.error || "Gagal menyimpan." });
      return null;
    }
    setNotice({ type: "ok", text: okText });
    return data;
  }

  const maskedKey = apiKey.slice(0, 8) + "•".repeat(24) + apiKey.slice(-4);

  return (
    <div className="stack">
      <div className="glass pad">
        <Sparkle size={22} style={{ right: 26, top: 24 }} />
        <Sparkle size={11} style={{ right: 60, top: 54 }} delay={2} />
        <p className="eyebrow" style={{ margin: 0 }}>Dashboard</p>
        <h1 style={{ fontSize: 32, margin: "6px 0 14px" }}>Halo, {user.display_name}</h1>
        <p className="muted small" style={{ margin: "0 0 8px" }}>Link halaman pesanmu — bagikan ke penonton/pemain:</p>
        <div className="keybox">
          <code>{link}</code>
          <button className="btn btn-sm" onClick={() => copy(link, "link")}>{copied === "link" ? "Tersalin" : "Salin"}</button>
          <a className="btn btn-sm" href={link} target="_blank" rel="noreferrer">Buka</a>
        </div>
      </div>

      {notice && <div className={`alert ${notice.type === "ok" ? "alert-ok" : "alert-error"}`}>{notice.text}</div>}

      <div className="grid-2">
        <div className="glass pad">
          <div className="spread" style={{ marginBottom: 14 }}>
            <h2>Pesan masuk</h2>
            <span className="badge">{initialMessages.length} pesan</span>
          </div>
          <MessageList initial={initialMessages} />
        </div>

        <div className="stack">
          <div className="glass pad">
            <h2 style={{ marginBottom: 6 }}>Hubungkan ke Roblox</h2>
            <p className="muted small" style={{ marginTop: 0 }}>
              Script <code>SawerWebBridge</code> di ServerScriptService mengambil pesan memakai data ini.
            </p>
            <p className="small faint" style={{ margin: "14px 0 6px" }}>BaseUrl</p>
            <div className="keybox">
              <code>{origin}</code>
              <button className="btn btn-sm" onClick={() => copy(origin, "url")}>{copied === "url" ? "Tersalin" : "Salin"}</button>
            </div>
            <p className="small faint" style={{ margin: "14px 0 6px" }}>API key (rahasia — jangan dibagikan)</p>
            <div className="keybox">
              <code>{showKey ? apiKey : maskedKey}</code>
              <button className="btn btn-sm" onClick={() => setShowKey((s) => !s)}>{showKey ? "Sembunyikan" : "Lihat"}</button>
              <button className="btn btn-sm" onClick={() => copy(apiKey, "key")}>{copied === "key" ? "Tersalin" : "Salin"}</button>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <button
                className="btn btn-sm btn-danger"
                onClick={async () => {
                  if (!confirm("Buat API key baru? Key lama langsung tidak berlaku, jadi Secret di Roblox harus diganti.")) return;
                  const d = await patch({ regenerate_key: true }, "API key baru dibuat. Perbarui Secret di Roblox.");
                  if (d?.api_key) setApiKey(d.api_key);
                }}
              >
                Buat key baru
              </button>
            </div>
            <ol className="muted small" style={{ paddingLeft: 18, margin: "18px 0 0" }}>
              <li>Studio: <b>Game Settings → Security → Allow HTTP Requests</b> = ON.</li>
              <li>Creator Hub → game → <b>Configure → Secrets</b>: buat secret <code>sawerku_key</code> berisi API key di atas, domain <code>{new URL(origin).hostname}</code>.</li>
              <li>Di script <code>SawerWebBridge</code>, isi <code>CONFIG.BaseUrl</code> dengan BaseUrl di atas.</li>
              <li>Publish game. Pesan baru muncul di papan dalam ±10 detik.</li>
            </ol>
          </div>

          <div className="glass pad">
            <h2 style={{ marginBottom: 14 }}>Profil</h2>
            <label className="field">
              <span>Nama tampilan</span>
              <input className="input" value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
            </label>
            <label className="field">
              <span>Bio singkat (tampil di halaman pesan)</span>
              <input className="input" value={profile.bio} maxLength={160} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
            </label>
            <button className="btn btn-primary" onClick={() => patch(profile, "Profil disimpan.")}>Simpan profil</button>

            <h3 style={{ margin: "26px 0 12px" }}>Ganti password</h3>
            <label className="field">
              <span>Password lama</span>
              <input className="input" type="password" value={pw.old_password} onChange={(e) => setPw({ ...pw, old_password: e.target.value })} autoComplete="current-password" />
            </label>
            <label className="field">
              <span>Password baru (min. 8 karakter)</span>
              <input className="input" type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} autoComplete="new-password" />
            </label>
            <button
              className="btn"
              onClick={async () => {
                const d = await patch(pw, "Password diganti.");
                if (d) setPw({ old_password: "", new_password: "" });
              }}
            >
              Ganti password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
