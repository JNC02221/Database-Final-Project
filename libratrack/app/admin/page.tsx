"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { AdminTable, EmptyState, LoadingState, Notice, PageHeading, requestJson } from "@/components/admin-ui";

type Summary = { total_books: number; total_copies_available: number | string; active_loans: number; overdue_loans: number; unpaid_fines_total: number | string; lowStock: Array<{ book_id: number; title: string; available_copies: number; total_copies: number }>; mostOverdue: Array<{ loan_id: number; member_name: string; book_title: string; due_date: string; days_overdue: number }> };

export default function AdminPage() {
  const [summary, setSummary] = useState<Summary | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { await Promise.resolve(); setLoading(true); setError(""); try { setSummary(await requestJson<Summary>("/api/admin/summary")); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load summary"); } finally { setLoading(false); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const cards = summary ? [{ label: "Book titles", value: summary.total_books }, { label: "Copies available", value: summary.total_copies_available }, { label: "Active loans", value: summary.active_loans }, { label: "Overdue loans", value: summary.overdue_loans }, { label: "Unpaid fines", value: `$${Number(summary.unpaid_fines_total).toFixed(2)}` }] : [];
  const sections = [{ href: "/admin/books", title: "Books", detail: "Manage titles and copies" }, { href: "/admin/members", title: "Members", detail: "Profiles and loan history" }, { href: "/admin/loans", title: "Loans", detail: "Issue and return books" }, { href: "/admin/requests", title: "Requests", detail: "Approve member requests" }, { href: "/admin/fines", title: "Fines", detail: "Review and record payments" }];
  return <AppShell><PageHeading eyebrow="Administration" title="Library overview" description="A live snapshot of collection and circulation activity." />
    {error ? <Notice message={error} kind="error" /> : loading ? <LoadingState label="Loading library summary…" /> : summary && <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cards.map((card) => <article key={card.label} className="panel p-6"><p className="text-sm font-medium text-subtle">{card.label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-primary">{card.value}</p></article>)}</div>
      <div className="my-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{sections.map((section) => <Link key={section.href} href={section.href} className="rounded-xl border border-indigo-100 bg-indigo-50 p-5 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:hover:border-indigo-700 dark:hover:bg-indigo-950"><h2 className="font-bold text-indigo-950 dark:text-indigo-200">{section.title}</h2><p className="mt-1 text-sm text-indigo-700 dark:text-indigo-300">{section.detail}</p></Link>)}</div>
      <div className="grid gap-7 xl:grid-cols-2"><section><h2 className="mb-3 text-lg font-bold text-primary">Low stock</h2>{summary.lowStock.length === 0 ? <EmptyState title="Stock looks good" detail="No books have one or fewer available copies." /> : <AdminTable headings={["Book", "Available", "Total"]}>{summary.lowStock.map((book) => <tr key={book.book_id} className="table-row"><td className="table-cell font-medium">{book.title}</td><td className="table-cell"><span className={book.available_copies === 0 ? "badge-unavailable" : "badge-available"}>{book.available_copies}</span></td><td className="table-cell">{book.total_copies}</td></tr>)}</AdminTable>}</section>
      <section><h2 className="mb-3 text-lg font-bold text-primary">Most overdue</h2>{summary.mostOverdue.length === 0 ? <EmptyState title="Nothing overdue" detail="There are no past-due active loans." /> : <AdminTable headings={["Member / Book", "Due", "Days"]}>{summary.mostOverdue.map((loan) => <tr key={loan.loan_id} className="table-row"><td className="table-cell"><p className="font-medium">{loan.member_name}</p><p className="text-muted">{loan.book_title}</p></td><td className="table-cell">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(loan.due_date))}</td><td className="table-cell font-semibold text-red-700 dark:text-red-400">{loan.days_overdue}</td></tr>)}</AdminTable>}</section></div>
    </>}
  </AppShell>;
}
