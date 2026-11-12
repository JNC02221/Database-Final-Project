"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { EmptyState, LoadingState, Notice, PageHeading, requestJson } from "@/components/admin-ui";

type Notification = { id: string; type: string; severity: "info" | "warning" | "urgent"; message: string; link?: string };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { await Promise.resolve(); setLoading(true); setError(""); try { const data = await requestJson<{ notifications: Notification[] }>("/api/me/notifications"); setNotifications(data.notifications); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load notifications"); } finally { setLoading(false); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  return <AppShell><PageHeading eyebrow="Member account" title="Notifications" description="Due dates, fines, and ready-for-pickup requests." />{error && <Notice message={error} kind="error" />}{loading ? <LoadingState label="Loading notifications…" /> : notifications.length === 0 ? <EmptyState title="You’re all caught up" detail="There are no current alerts for your account." /> : <div className="space-y-3">{notifications.map((item) => <article key={item.id} className={`rounded-xl border bg-white p-5 shadow-sm ${item.severity === "urgent" ? "border-red-300" : item.severity === "warning" ? "border-amber-300" : "border-blue-200"}`}><div className="flex items-start gap-3"><span className={`mt-1 size-3 shrink-0 rounded-full ${item.severity === "urgent" ? "bg-red-500" : item.severity === "warning" ? "bg-amber-500" : "bg-blue-500"}`} /><div><p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{item.type}</p><p className="mt-1 text-slate-900">{item.message}</p>{item.link && <Link href={item.link} className="mt-2 inline-block text-sm font-semibold text-indigo-700">View details</Link>}</div></div></article>)}</div>}
  </AppShell>;
}
