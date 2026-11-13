"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import ThemeToggle from "@/components/theme-toggle";

type Session = { userId: number; name: string; role: "ADMIN" | "MEMBER" };
type Notification = { id: string; severity: "info" | "warning" | "urgent"; message: string; link?: string };

export default function AppShell({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timer = window.setTimeout(() => setNotificationsOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

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

  useEffect(() => {
    if (session?.role !== "MEMBER") return;
    let active = true;
    const refresh = () => fetch("/api/me/notifications", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : { notifications: [] })
      .then((data: { notifications: Notification[] }) => { if (active) setNotifications(data.notifications); })
      .catch(() => undefined);
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [session?.role]);

  async function logout() {
    setLoggingOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); }
    finally { setLoggingOut(false); router.replace("/login"); router.refresh(); }
  }

  const links = session?.role === "ADMIN"
    ? [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/books", label: "Books" },
      { href: "/admin/members", label: "Members" },
      { href: "/admin/loans", label: "Loans" },
      { href: "/admin/requests", label: "Requests" },
      { href: "/admin/fines", label: "Fines" },
      { href: "/catalogue", label: "Catalogue" },
    ]
    : [{ href: "/catalogue", label: "Catalogue" }, { href: "/account", label: "My account" }];

  return <div className="app-page min-h-screen">
    <header className="surface border-b shadow-sm dark:shadow-black/20">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <Link href={session?.role === "ADMIN" ? "/admin" : "/catalogue"} className="mr-auto text-xl font-bold tracking-tight text-indigo-700 dark:text-indigo-400">LibraTrack</Link>
        {session && <>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Main navigation">{links.map((link) => <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 text-sm font-medium ${pathname === link.href ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "text-muted hover:bg-slate-100 dark:hover:bg-slate-800"}`}>{link.label}</Link>)}</nav>
          {session.role === "MEMBER" && <div className="relative"><button type="button" className="icon-button relative text-lg" aria-label="Notifications" title="Notifications" onClick={() => setNotificationsOpen((open) => !open)}>🔔{notifications.length > 0 && <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-600 px-1 text-center text-xs font-bold leading-5 text-white dark:bg-red-500">{notifications.length}</span>}</button>{notificationsOpen && <div className="surface absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border shadow-xl dark:shadow-black/40"><div className="app-border border-b px-4 py-3 font-semibold text-primary">Notifications</div><div className="max-h-80 overflow-y-auto">{notifications.length === 0 ? <p className="p-4 text-sm text-muted">You&apos;re all caught up.</p> : notifications.map((item) => <Link key={item.id} href={item.link ?? "/notifications"} onClick={() => setNotificationsOpen(false)} className="app-border block border-b px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><span className={`mr-2 inline-block size-2 rounded-full ${item.severity === "urgent" ? "bg-red-500" : item.severity === "warning" ? "bg-amber-500" : "bg-blue-500"}`} />{item.message}</Link>)}</div><Link href="/notifications" onClick={() => setNotificationsOpen(false)} className="block px-4 py-3 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950">View all notifications</Link></div>}</div>}
          <ThemeToggle />
          <div className="app-border hidden border-l pl-5 text-right sm:block"><p className="text-sm font-semibold text-primary">{session.name}</p><p className="text-xs font-medium tracking-wide text-subtle">{session.role}</p></div>
          <button onClick={logout} disabled={loggingOut} className="button-secondary">{loggingOut ? "Signing out…" : "Logout"}</button>
        </>}
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{error ? <div className="alert-error">{error}</div> : !session ? <div className="loading-card">Loading your account…</div> : children}</main>
  </div>;
}
