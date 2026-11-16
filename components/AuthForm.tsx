"use client";

import { useState } from "react";

// Dipakai halaman Login & Setup admin pertama
export default function AuthForm({ mode }: { mode: "login" | "setup" }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password, display_name: displayName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal.");
      window.location.href = mode === "setup" || data.role === "admin" ? "/admin" : "/dashboard";
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <label className="field">
        <span>Username</span>
        <input
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          autoComplete="username"
          required
        />
      </label>
      {mode === "setup" && (
        <label className="field">
          <span>Nama tampilan</span>
          <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
      )}
      <label className="field">
        <span>Password{mode === "setup" ? " (min. 8 karakter)" : ""}</span>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </label>
      <button className="btn btn-primary btn-lg" disabled={busy}>
        {busy ? "Memproses…" : mode === "login" ? "Masuk" : "Buat akun admin"}
      </button>
    </form>
  );
}
