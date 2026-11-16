import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import DonateForm from "@/components/DonateForm";
import { Sparkle } from "@/components/Decor";
import { getUserByUsername } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const user = await getUserByUsername(slug);
  return { title: user ? `Kirim pesan ke ${user.display_name} — Sawerku` : "Tidak ditemukan — Sawerku" };
}

export default async function CreatorPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUserByUsername(slug);
  if (!user || !user.active) notFound();

  return (
    <>
      <Nav />
      <main className="container narrow" style={{ paddingBottom: 40 }}>
        <div className="glass pad" style={{ marginTop: 12 }}>
          <Sparkle size={22} style={{ right: 26, top: 22 }} />
          <Sparkle size={12} style={{ right: 58, top: 52 }} delay={2.2} />
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 22 }}>
            <div className="avatar">{user.display_name.slice(0, 1).toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <p className="eyebrow" style={{ margin: 0 }}>Kirim pesan ke</p>
              <h2 style={{ fontSize: 26 }}>{user.display_name}</h2>
              <p className="muted small" style={{ margin: "2px 0 0" }}>
                {user.bio || "Pesanmu akan tampil di papan donasi di dalam game."}
              </p>
            </div>
          </div>
          <DonateForm slug={user.username} creatorName={user.display_name} />
        </div>
        <p className="faint small" style={{ textAlign: "center", marginTop: 18 }}>
          Pesan disaring otomatis oleh filter Roblox. Jangan menulis data pribadi.
        </p>
      </main>
    </>
  );
}
