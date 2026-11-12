"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/app-shell";

type Summary = { total_books: number; total_copies_available: number | string; active_loans: number; overdue_loans: number; unpaid_fines_total: number | string };

export default function AdminPage() {
  const [summary, setSummary] = useState<Summary | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true); setError("");
    try { const response = await fetch("/api/admin/summary", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Unable to load summary"); setSummary(data); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load summary"); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const cards = summary ? [
    { label: "Book titles", value: summary.total_books }, { label: "Copies available", value: summary.total_copies_available },
    { label: "Active loans", value: summary.active_loans }, { label: "Overdue loans", value: summary.overdue_loans },
    { label: "Unpaid fines", value: `$${Number(summary.unpaid_fines_total).toFixed(2)}` },
  ] : [];
  return <AppShell><div className="mb-7"><p className="eyebrow">Administration</p><h1 className="page-title">Library overview</h1><p className="page-subtitle">A live snapshot of collection and circulation activity.</p></div>
    {error ? <div className="alert-error flex items-center justify-between"><span>{error}</span><button onClick={load} className="font-semibold underline">Try again</button></div> : loading ? <div className="loading-card">Loading library summary…</div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cards.map((card) => <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-medium text-slate-500">{card.label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{card.value}</p></article>)}</div>}
  </AppShell>;
}
