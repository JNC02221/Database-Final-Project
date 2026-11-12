"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/app-shell";

type Loan = { loan_id: number; title: string; isbn: string; issue_date: string; due_date: string; status: string; unpaid_fines: string };
const dateFormat = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
function displayDate(value: string) { return dateFormat.format(new Date(value)); }
function isOverdue(value: string) { const due = new Date(value); due.setUTCHours(23, 59, 59, 999); return due.getTime() < Date.now(); }

export default function AccountPage() {
  const [loans, setLoans] = useState<Loan[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true); setError("");
    try { const response = await fetch("/api/me/loans", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Unable to load loans"); setLoans(data.loans ?? []); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load loans"); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const fineTotal = loans.reduce((sum, loan) => sum + Number(loan.unpaid_fines), 0);

  return <AppShell><div className="mb-7"><p className="eyebrow">Member account</p><h1 className="page-title">Current loans</h1><p className="page-subtitle">Keep track of due dates and any unpaid fines.</p></div>
    {!loading && !error && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5"><p className="text-sm font-medium text-amber-800">Total unpaid fines</p><p className="mt-1 text-3xl font-bold text-amber-950">${fineTotal.toFixed(2)}</p></div>}
    {error ? <div className="alert-error flex items-center justify-between"><span>{error}</span><button onClick={load} className="font-semibold underline">Try again</button></div> : loading ? <div className="loading-card">Loading your loans…</div> : loans.length === 0 ? <div className="empty-card"><h2 className="font-semibold text-slate-900">No current loans</h2><p className="mt-1 text-sm text-slate-600">Books you borrow will appear here.</p></div> : <div className="grid gap-4">{loans.map((loan) => { const overdue = isOverdue(loan.due_date); return <article key={loan.loan_id} className={`rounded-xl border bg-white p-5 shadow-sm ${overdue ? "border-red-300 ring-1 ring-red-100" : "border-slate-200"}`}><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-semibold text-slate-900">{loan.title}</h2><p className="mt-1 font-mono text-xs text-slate-500">{loan.isbn}</p></div><span className={overdue ? "badge-unavailable" : "badge-available"}>{overdue ? "Overdue" : loan.status}</span></div><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3"><div><dt className="text-slate-500">Borrowed</dt><dd className="mt-1 font-medium text-slate-900">{displayDate(loan.issue_date)}</dd></div><div><dt className="text-slate-500">Due</dt><dd className={`mt-1 font-medium ${overdue ? "text-red-700" : "text-slate-900"}`}>{displayDate(loan.due_date)}</dd></div><div><dt className="text-slate-500">Unpaid fine</dt><dd className="mt-1 font-medium text-slate-900">${Number(loan.unpaid_fines).toFixed(2)}</dd></div></dl></article>; })}</div>}
  </AppShell>;
}
