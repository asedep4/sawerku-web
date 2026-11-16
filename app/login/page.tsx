import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import AuthForm from "@/components/AuthForm";
import { Sparkle } from "@/components/Decor";
import { currentUser } from "@/lib/auth";
import { countAdmins } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if ((await countAdmins()) === 0) redirect("/setup");
  const user = await currentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");
  return (
    <>
      <Nav />
      <main className="container" style={{ maxWidth: 440, paddingTop: 24 }}>
        <div className="glass pad">
          <Sparkle size={20} style={{ right: 24, top: 24 }} />
          <h2 style={{ marginBottom: 4 }}>Masuk</h2>
          <p className="muted small" style={{ marginTop: 0, marginBottom: 22 }}>
            Akun kreator dibuat oleh admin. Hubungi admin jika belum punya.
          </p>
          <AuthForm mode="login" />
        </div>
      </main>
    </>
  );
}
