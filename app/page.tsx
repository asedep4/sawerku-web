import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { Sparkle } from "@/components/Decor";
import { countAdmins } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  // instalasi baru: arahkan ke pembuatan admin pertama
  if ((await countAdmins()) === 0) redirect("/setup");

  return (
    <>
      <Nav />
      <main className="container">
        <section style={{ position: "relative", padding: "56px 0 40px", textAlign: "center" }}>
          <Sparkle size={26} style={{ left: "12%", top: 40 }} />
          <Sparkle size={14} style={{ right: "16%", top: 90 }} delay={1.6} />
          <Sparkle size={18} style={{ right: "26%", bottom: 10 }} delay={3.1} />
          <p className="eyebrow">Pesan langsung ke game Roblox</p>
          <h1 style={{ margin: "14px auto 16px", maxWidth: 720 }}>
            Ketik username dan kata-katamu, <span style={{ color: "var(--blue-2)" }}>tampil di papan game.</span>
          </h1>
          <p className="muted" style={{ maxWidth: 560, margin: "0 auto 28px" }}>
            Tanpa daftar, tanpa bayar. Buka halaman kreator, tulis pesan, dan pesanmu muncul di papan
            donasi di dalam game dalam beberapa detik.
          </p>
          <div className="row" style={{ justifyContent: "center" }}>
            <Link href="/login" className="btn btn-primary">Masuk sebagai kreator</Link>
          </div>
        </section>

        <section className="grid-3" style={{ marginBottom: 24 }}>
          {[
            ["1", "Buka halaman kreator", "Setiap kreator punya alamat sendiri, misalnya sawerku.vercel.app/natkit."],
            ["2", "Tulis username & pesan", "Masukkan username Roblox-mu dan kata-kata (maks. 150 huruf)."],
            ["3", "Muncul di game", "Server game mengambil pesan baru, menyaringnya dengan filter Roblox, lalu menampilkannya."],
          ].map(([n, t, d]) => (
            <div key={n} className="glass pad">
              <span className="badge badge-blue" style={{ marginBottom: 12 }}>Langkah {n}</span>
              <h3 style={{ marginBottom: 6 }}>{t}</h3>
              <p className="muted small" style={{ margin: 0 }}>{d}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="footer">Sawerku · pesan disaring filter teks Roblox sebelum tampil di game</footer>
    </>
  );
}
