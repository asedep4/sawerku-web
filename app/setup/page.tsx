import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { BrandMark, Sparkle } from "@/components/Decor";
import { countAdmins, usingMemoryStore } from "@/lib/db";

export const dynamic = "force-dynamic";

// Hanya muncul sekali: saat belum ada admin sama sekali
export default async function SetupPage() {
  if ((await countAdmins()) > 0) redirect("/login");
  return (
    <main className="container" style={{ maxWidth: 460, paddingTop: 60 }}>
      <div className="glass pad">
        <Sparkle size={22} style={{ right: 24, top: 24 }} />
        <div className="brand" style={{ marginBottom: 18 }}><BrandMark /> Sawerku</div>
        <h2 style={{ marginBottom: 4 }}>Buat akun admin pertama</h2>
        <p className="muted small" style={{ marginTop: 0, marginBottom: 20 }}>
          Halaman ini hanya muncul sekali. Setelah admin dibuat, user lain ditambahkan dari panel admin.
        </p>
        {usingMemoryStore && (
          <div className="alert alert-warn">
            DATABASE_URL belum diisi: data disimpan sementara di memori dan hilang saat server mati.
          </div>
        )}
        <AuthForm mode="setup" />
      </div>
    </main>
  );
}
