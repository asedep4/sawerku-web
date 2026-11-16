import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import AdminPanel from "@/components/AdminPanel";
import { currentUser } from "@/lib/auth";
import { listMessages, listUsers, toPublic, usingMemoryStore } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");
  const users = (await listUsers()).map((u) => ({ ...toPublic(u), message_count: u.message_count }));
  const messages = await listMessages(null, 50);

  return (
    <>
      <Nav />
      <main className="container" style={{ paddingBottom: 40 }}>
        {usingMemoryStore && (
          <div className="alert alert-warn">
            Mode tes: DATABASE_URL belum diisi, data hilang saat server dimatikan.
          </div>
        )}
        <AdminPanel me={user.id} initialUsers={users} recent={messages} />
      </main>
    </>
  );
}
