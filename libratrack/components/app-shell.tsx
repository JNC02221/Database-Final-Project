"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type Session = { userId: number; name: string; role: "ADMIN" | "MEMBER" };

export default function AppShell({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) { router.replace("/login"); return null; }
        if (!response.ok) throw new Error("Unable to load your session");
        return (await response.json()) as Session;
      })
      .then((data) => active && data && setSession(data))
      .catch((reason: Error) => active && setError(reason.message));
    return () => { active = false; };
  }, [router]);

  async function logout() {
    setLoggingOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); }
    finally { router.replace("/login"); router.refresh(); }
  }

  const links = session?.role === "ADMIN"
    ? [{ href: "/admin", label: "Dashboard" }, { href: "/catalogue", label: "Catalogue" }]
    : [{ href: "/catalogue", label: "Catalogue" }, { href: "/account", label: "My account" }];

  return <div className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <Link href={session?.role === "ADMIN" ? "/admin" : "/catalogue"} className="mr-auto text-xl font-bold tracking-tight text-indigo-700">LibraTrack</Link>
        {session && <>
          <nav className="flex items-center gap-1" aria-label="Main navigation">{links.map((link) => <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 text-sm font-medium ${pathname === link.href ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}>{link.label}</Link>)}</nav>
          <div className="hidden border-l border-slate-200 pl-5 text-right sm:block"><p className="text-sm font-semibold text-slate-900">{session.name}</p><p className="text-xs font-medium tracking-wide text-slate-500">{session.role}</p></div>
          <button onClick={logout} disabled={loggingOut} className="button-secondary">{loggingOut ? "Signing out…" : "Logout"}</button>
        </>}
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{error ? <div className="alert-error">{error}</div> : !session ? <div className="loading-card">Loading your account…</div> : children}</main>
  </div>;
}
