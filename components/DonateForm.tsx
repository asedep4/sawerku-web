"use client";

import { useState } from "react";
import { Waves, Sparkle } from "./Decor";

const MAX = 150;

export default function DonateForm({ slug, creatorName }: { slug: string; creatorName: string }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[A-Za-z0-9_]{3,20}$/.test(name)) {
      setError("Username Roblox 3-20 karakter (huruf, angka, atau _).");
      return;
    }
    if (message.trim().length < 2) {
      setError("Tulis kata-katanya dulu.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, name, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal mengirim. Coba lagi.");
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "18px 0 6px", position: "relative" }}>
        <Sparkle size={30} style={{ left: "50%", top: -4, marginLeft: -15 }} />
        <h2 style={{ marginTop: 34 }}>Pesan terkirim!</h2>
        <p className="muted">
          Pesanmu akan muncul di papan game {creatorName} dalam beberapa detik.
        </p>
        <button
          className="btn"
          onClick={() => {
            setSent(false);
            setMessage("");
          }}
        >
          Kirim pesan lain
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <label className="field">
        <span>Username Roblox kamu</span>
        <div className="input-prefix">
          <b>@</b>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 20))}
            placeholder="contoh: NattCipp"
            autoComplete="off"
            inputMode="text"
            required
          />
        </div>
      </label>

      <label className="field">
        <span>Kata-kata</span>
        <textarea
          className="input"
          value={message}
          maxLength={MAX}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
          placeholder="Semangat terus mainnya!"
          required
        />
        <div className="counter">{message.length}/{MAX}</div>
      </label>

      <div style={{ marginBottom: 20 }}>
        <p className="small faint" style={{ margin: "0 0 8px" }}>Pratinjau di papan game</p>
        <div className="board">
          <div className="board-head">
            <div className="who">{name || "Username"}</div>
            <div className="tag">PESAN DARI WEB</div>
          </div>
          <div className="board-body">
            <div className="board-screen">
              <Waves className="waves" />
              <span>{message.trim() || "Kata-katamu tampil di sini"}</span>
            </div>
          </div>
        </div>
      </div>

      <button className="btn btn-primary btn-lg" disabled={busy}>
        {busy ? "Mengirim…" : "Kirim pesan"}
      </button>
    </form>
  );
}
