"use client";

import { useState } from "react";
import type { Message } from "@/lib/db";

type Msg = Message & { creator_username?: string };

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function MessageList({ initial, showCreator = false }: { initial: Msg[]; showCreator?: boolean }) {
  const [items, setItems] = useState(initial);

  async function toggle(m: Msg) {
    const res = await fetch(`/api/messages/${m.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hidden: !m.hidden }),
    });
    if (res.ok) setItems((xs) => xs.map((x) => (x.id === m.id ? { ...x, hidden: !m.hidden } : x)));
  }

  async function remove(m: Msg) {
    if (!confirm(`Hapus pesan dari @${m.donor_name}? Tidak bisa dibatalkan.`)) return;
    const res = await fetch(`/api/messages/${m.id}`, { method: "DELETE" });
    if (res.ok) setItems((xs) => xs.filter((x) => x.id !== m.id));
  }

  if (items.length === 0) {
    return <div className="empty">Belum ada pesan. Bagikan link halamanmu.</div>;
  }

  return (
    <div className="msg-list">
      {items.map((m) => (
        <div key={m.id} className={`msg ${m.hidden ? "hidden-msg" : ""}`}>
          <div className="meta">
            <span className="name">@{m.donor_name}</span>
            {showCreator && m.creator_username && <span>→ /{m.creator_username}</span>}
            <span>{fmt(m.created_at)}</span>
            {m.hidden ? (
              <span className="badge badge-off">Disembunyikan</span>
            ) : m.delivered_at ? (
              <span className="badge badge-ok"><span className="dot" />Tampil di game</span>
            ) : (
              <span className="badge">Menunggu game</span>
            )}
          </div>
          <div style={{ wordBreak: "break-word" }}>{m.message}</div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btn-sm" onClick={() => toggle(m)}>{m.hidden ? "Tampilkan" : "Sembunyikan"}</button>
            <button className="btn btn-sm btn-danger" onClick={() => remove(m)}>Hapus</button>
          </div>
        </div>
      ))}
    </div>
  );
}
