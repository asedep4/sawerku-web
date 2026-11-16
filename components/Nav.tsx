import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { BrandMark } from "./Decor";
import LogoutButton from "./LogoutButton";

export default async function Nav() {
  const user = await currentUser();
  return (
    <div className="container">
      <nav className="nav">
        <Link href="/" className="brand">
          <BrandMark /> Sawerku
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link href="/admin" className="btn btn-sm">Admin</Link>
              )}
              <Link href="/dashboard" className="btn btn-sm">Dashboard</Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="btn btn-sm">Masuk</Link>
          )}
        </div>
      </nav>
    </div>
  );
}
