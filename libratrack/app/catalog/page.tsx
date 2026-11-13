"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import AppShell from "@/components/app-shell";
import { Notice, requestJson } from "@/components/admin-ui";

type Category = { category_id: number; name: string };
type Book = { book_id: number; isbn: string; title: string; authors: string | null; category_name: string; publisher_name: string; total_copies: number; available_copies: number };

export default function CatalogPage() {
  const [books, setBooks] = useState<Book[]>([]); const [categories, setCategories] = useState<Category[]>([]);
  const [queryInput, setQueryInput] = useState(""); const [query, setQuery] = useState(""); const [category, setCategory] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const pageSize = 10;
  const [role, setRole] = useState<"ADMIN" | "MEMBER" | null>(null); const [loanBookIds, setLoanBookIds] = useState<Set<number>>(new Set());
  const [requestBookIds, setRequestBookIds] = useState<Set<number>>(new Set()); const [success, setSuccess] = useState(""); const [requesting, setRequesting] = useState<number | null>(null);

  const loadBooks = useCallback(async () => {
    await Promise.resolve();
    setLoading(true); setError("");
    const params = new URLSearchParams({ q: query, category, availableOnly: String(availableOnly), page: String(page), pageSize: String(pageSize) });
    try {
      const response = await fetch(`/api/books?${params}`, { cache: "no-store" }); const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load books"); setBooks(data.books ?? []); setTotal(data.total ?? 0);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load books"); }
    finally { setLoading(false); }
  }, [availableOnly, category, page, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBooks(), 0);
    return () => window.clearTimeout(timer);
  }, [loadBooks]);
  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" }).then(async (response) => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Unable to load categories"); setCategories(data.categories ?? []);
    }).catch((reason: Error) => setError(reason.message));
  }, []);
  useEffect(() => {
    requestJson<{ role: "ADMIN" | "MEMBER" }>("/api/auth/me").then((session) => {
      setRole(session.role);
      if (session.role === "MEMBER") {
        Promise.all([
          requestJson<{ currentLoans: Array<{ book_id: number }> }>("/api/me/loans"),
          requestJson<{ requests: Array<{ book_id: number; status: string }> }>("/api/me/requests"),
        ]).then(([loanData, requestData]) => {
          setLoanBookIds(new Set(loanData.currentLoans.map((loan) => loan.book_id)));
          setRequestBookIds(new Set(requestData.requests.filter((item) => item.status === "PENDING" || item.status === "READY").map((item) => item.book_id)));
        }).catch((reason: Error) => setError(reason.message));
      }
    }).catch((reason: Error) => setError(reason.message));
  }, []);

  function search(event: FormEvent) { event.preventDefault(); setPage(1); setQuery(queryInput.trim()); }
  const pages = Math.max(1, Math.ceil(total / pageSize));
  async function requestBook(book: Book) {
    setRequesting(book.book_id); setError(""); setSuccess("");
    try { const data = await requestJson<{ waitingList: boolean }>("/api/me/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: book.book_id }) }); setRequestBookIds((current) => new Set(current).add(book.book_id)); setSuccess(data.waitingList ? `You joined the waiting list for “${book.title}”.` : `“${book.title}” was requested.`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to request book"); } finally { setRequesting(null); }
  }

  return <AppShell><div className="mb-7"><p className="eyebrow">Library collection</p><h1 className="page-title">Book catalog</h1><p className="page-subtitle">Search by title, author, or ISBN and check live availability.</p></div>
    {success && <Notice message={success} onClose={() => setSuccess("")} />}
    <form onSubmit={search} className="panel mb-6 grid gap-4 p-4 md:grid-cols-[1fr_220px_auto_auto] md:items-end">
      <label className="field-label">Search<input className="field-input" value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Title, author, or ISBN" /></label>
      <label className="field-label">Category<select className="field-input" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((item) => <option key={item.category_id} value={item.category_id}>{item.name}</option>)}</select></label>
      <label className="catalog-filter flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-200"><input type="checkbox" checked={availableOnly} onChange={(event) => { setAvailableOnly(event.target.checked); setPage(1); }} className="catalog-checkbox size-4 accent-indigo-600" />Available only</label>
      <button className="button-primary h-11">Search</button>
    </form>
    {error ? <div className="alert-error flex items-center justify-between gap-3"><span>{error}</span><button onClick={loadBooks} className="font-semibold underline">Try again</button></div> : loading ? <div className="loading-card">Loading books…</div> : books.length === 0 ? <div className="empty-card"><h2 className="font-semibold text-primary">No books found</h2><p className="mt-1 text-sm text-muted">Try changing your search or filters.</p></div> : <>
      <div className="surface overflow-hidden rounded-xl border shadow-sm dark:shadow-black/20"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="surface-muted text-xs uppercase tracking-wide text-subtle"><tr><th className="table-cell">Book</th><th className="table-cell">Category</th><th className="table-cell">Publisher</th><th className="table-cell">Availability</th>{role === "MEMBER" && <th className="table-cell">Request</th>}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{books.map((book) => { const disabledReason = loanBookIds.has(book.book_id) ? "You already have this book on loan" : requestBookIds.has(book.book_id) ? "You already have an open request" : ""; return <tr key={book.book_id} className="table-row"><td className="table-cell"><p className="font-semibold text-primary">{book.title}</p><p className="mt-1 text-muted">{book.authors || "Unknown author"}</p><p className="mt-1 font-mono text-xs text-subtle">{book.isbn}</p></td><td className="table-cell text-primary">{book.category_name}</td><td className="table-cell text-primary">{book.publisher_name}</td><td className="table-cell"><span className={book.available_copies > 0 ? "badge-available" : "badge-unavailable"}>{book.available_copies > 0 ? `Available (${book.available_copies})` : "Unavailable"}</span><p className="mt-2 text-xs text-subtle">{book.total_copies} total</p></td>{role === "MEMBER" && <td className="table-cell"><button className="button-primary" disabled={Boolean(disabledReason) || requesting === book.book_id} title={disabledReason || undefined} onClick={() => void requestBook(book)}>{requesting === book.book_id ? "Requesting…" : book.available_copies > 0 ? "Request" : "Reserve (join waiting list)"}</button></td>}</tr>; })}</tbody></table></div></div>
      <div className="mt-5 flex items-center justify-between text-sm text-muted"><p>{total} {total === 1 ? "book" : "books"}</p><div className="flex items-center gap-3"><button className="button-secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="button-secondary" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
    </>}
  </AppShell>;
}
