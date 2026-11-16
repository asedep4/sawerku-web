import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Nav from "@/components/Nav";
import Dashboard from "@/components/Dashboard";
import { currentUser } from "@/lib/auth";
import { listMessages, toPublic, usingMemoryStore } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const messages = await listMessages(user.id, 100);

  return (
    <>
      <Nav />
      <main className="container" style={{ paddingBottom: 40 }}>
        {usingMemoryStore && (
          <div className="alert alert-warn">
            Mode tes: DATABASE_URL belum diisi, data hilang saat server dimatikan.
          </div>
        )}
        <Dashboard user={toPublic(user)} origin={origin} initialMessages={messages} />
      </main>
    </>
  );
}
