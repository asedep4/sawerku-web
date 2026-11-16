"use client";

import { useState } from "react";
import type { Message, PublicUser } from "@/lib/db";
import { Sparkle } from "./Decor";
import MessageList from "./MessageList";

type Row = PublicUser & { message_count: number };
type Form = {
  id?: number;
  username: string;
  display_name: string;
  password: string;
  role: "admin" | "creator";
  active: boolean;
  bio: string;
  regenerate_key: boolean;
};

const empty: Form = { username: "", display_name: "", password: "", role: "creator", active: true, bio: "", regenerate_key: false };

export default function AdminPanel({ me, initialUsers, recent }: { me: number; initialUsers: Row[]; recent: Message[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const shown = users.filter(
    (u) => u.username.includes(query.toLowerCase()) || u.display_name.toLowerCase().includes(query.toLowerCase()),
  );

  async function reload() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers((await res.json()).users);
  }

  async function save() {
    if (!form) return;
    setBusy(true);
    setError("");
    const isNew = form.id === undefined;
    const body: Record<string, unknown> = {
      username: form.username,
      display_name: form.display_name,
      role: form.role,
      bio: form.bio,
    };
    if (form.password) body.password = form.password;
    if (!isNew) {
      body.active = form.active;
      if (form.regenerate_key) body.regenerate_key = true;
    }
    const res = await fetch(isNew ? "/api/admin/users" : `/api/admin/users/${form.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan.");
      return;
    }
    setForm(null);
    reload();
  }

  async function remove(u: Row) {
    if (!confirm(`Hapus @${u.username} beserta ${u.message_count} pesannya? Tidak bisa dibatalkan.`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) alert(data.error || "Gagal menghapus.");
    reload();
  }

  async function toggleActive(u: Row) {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) alert(data.error || "Gagal.");
    reload();
  }

  const total = users.reduce((n, u) => n + u.message_count, 0);

  return (
    <div className="stack">
      <div className="glass pad">
        <Sparkle size={22} style={{ right: 26, top: 24 }} />
        <Sparkle size={11} style={{ right: 60, top: 54 }} delay={2.4} />
        <p className="eyebrow" style={{ margin: 0 }}>Panel admin</p>
        <h1 style={{ fontSize: 32, margin: "6px 0 18px" }}>Kelola user</h1>
        <div className="grid-3">
          {[
            ["User", users.length],
            ["Aktif", users.filter((u) => u.active).length],
            ["Total pesan", total],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--line)" }}>
              <div className="small faint">{k}</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass pad">
        <div className="spread" style={{ marginBottom: 16 }}>
          <h2>Daftar user</h2>
          <div className="row">
            <input className="input" style={{ width: 200, padding: "8px 12px" }} placeholder="Cari user…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="btn btn-primary" onClick={() => { setError(""); setForm({ ...empty }); }}>+ Tambah user</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Pesan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{u.display_name}</div>
                    <a className="small" href={`/${u.username}`} target="_blank" rel="noreferrer">/{u.username}</a>
                  </td>
                  <td><span className={`badge ${u.role === "admin" ? "badge-blue" : ""}`}>{u.role === "admin" ? "Admin" : "Kreator"}</span></td>
                  <td>
                    {u.active ? <span className="badge badge-ok"><span className="dot" />Aktif</span> : <span className="badge badge-off">Nonaktif</span>}
                  </td>
                  <td>{u.message_count}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-sm"
                        onClick={() => {
                          setError("");
                          setForm({ id: u.id, username: u.username, display_name: u.display_name, password: "", role: u.role, active: u.active, bio: u.bio, regenerate_key: false });
                        }}
                      >
                        Edit
                      </button>
                      {u.id !== me && (
                        <>
                          <button className="btn btn-sm" onClick={() => toggleActive(u)}>{u.active ? "Nonaktifkan" : "Aktifkan"}</button>
                          <button className="btn btn-sm btn-danger" onClick={() => remove(u)}>Hapus</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={5} className="empty">Tidak ada user yang cocok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass pad">
        <div className="spread" style={{ marginBottom: 14 }}>
          <h2>Pesan terbaru (semua kreator)</h2>
          <span className="badge">50 terakhir</span>
        </div>
        <MessageList initial={recent} showCreator />
      </div>

      {form && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setForm(null)}>
          <div className="glass pad modal" role="dialog" aria-modal="true">
            <h2 style={{ marginBottom: 16 }}>{form.id === undefined ? "Tambah user" : `Edit @${form.username}`}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <label className="field">
              <span>Username (alamat halaman: /username)</span>
              <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} />
            </label>
            <label className="field">
              <span>Nama tampilan</span>
              <input className="input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            </label>
            <label className="field">
              <span>{form.id === undefined ? "Password (min. 8 karakter)" : "Password baru (kosongkan jika tidak diganti)"}</span>
              <input className="input" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </label>
            <label className="field">
              <span>Bio</span>
              <input className="input" value={form.bio} maxLength={160} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </label>
            <label className="field">
              <span>Role</span>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Form["role"] })}>
                <option value="creator">Kreator</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            {form.id !== undefined && (
              <>
                <label className="check">
                  <input type="checkbox" checked={form.active} disabled={form.id === me} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  Akun aktif
                </label>
                <label className="check">
                  <input type="checkbox" checked={form.regenerate_key} onChange={(e) => setForm({ ...form, regenerate_key: e.target.checked })} />
                  Buat API key Roblox baru (key lama tidak berlaku)
                </label>
              </>
            )}
            <div className="row" style={{ justifyContent: "flex-end", marginTop: 8 }}>
              <button className="btn" onClick={() => setForm(null)}>Batal</button>
              <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? "Menyimpan…" : "Simpan"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
