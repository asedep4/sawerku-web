import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container narrow" style={{ paddingTop: 100, textAlign: "center" }}>
      <div className="glass pad">
        <h2>Halaman tidak ditemukan</h2>
        <p className="muted">Periksa lagi alamat halaman kreatornya.</p>
        <Link href="/" className="btn">Kembali ke beranda</Link>
      </div>
    </main>
  );
}
