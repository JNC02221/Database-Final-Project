"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import AppShell from "@/components/app-shell";

type Category = { category_id: number; name: string };
type Book = { book_id: number; isbn: string; title: string; authors: string | null; category_name: string; publisher_name: string; total_copies: number; available_copies: number };

export default function CataloguePage() {
  const [books, setBooks] = useState<Book[]>([]); const [categories, setCategories] = useState<Category[]>([]);
  const [queryInput, setQueryInput] = useState(""); const [query, setQuery] = useState(""); const [category, setCategory] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const pageSize = 10;

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

  function search(event: FormEvent) { event.preventDefault(); setPage(1); setQuery(queryInput.trim()); }
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return <AppShell><div className="mb-7"><p className="eyebrow">Library collection</p><h1 className="page-title">Book catalogue</h1><p className="page-subtitle">Search by title, author, or ISBN and check live availability.</p></div>
    <form onSubmit={search} className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto_auto] md:items-end">
      <label className="field-label">Search<input className="field-input" value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Title, author, or ISBN" /></label>
      <label className="field-label">Category<select className="field-input" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((item) => <option key={item.category_id} value={item.category_id}>{item.name}</option>)}</select></label>
      <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={availableOnly} onChange={(event) => { setAvailableOnly(event.target.checked); setPage(1); }} className="size-4 accent-indigo-600" />Available only</label>
      <button className="button-primary h-11">Search</button>
    </form>
    {error ? <div className="alert-error flex items-center justify-between gap-3"><span>{error}</span><button onClick={loadBooks} className="font-semibold underline">Try again</button></div> : loading ? <div className="loading-card">Loading books…</div> : books.length === 0 ? <div className="empty-card"><h2 className="font-semibold text-slate-900">No books found</h2><p className="mt-1 text-sm text-slate-600">Try changing your search or filters.</p></div> : <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="table-cell">Book</th><th className="table-cell">Category</th><th className="table-cell">Publisher</th><th className="table-cell">Availability</th></tr></thead><tbody className="divide-y divide-slate-100">{books.map((book) => <tr key={book.book_id} className="hover:bg-slate-50/70"><td className="table-cell"><p className="font-semibold text-slate-900">{book.title}</p><p className="mt-1 text-slate-600">{book.authors || "Unknown author"}</p><p className="mt-1 font-mono text-xs text-slate-400">{book.isbn}</p></td><td className="table-cell text-slate-700">{book.category_name}</td><td className="table-cell text-slate-700">{book.publisher_name}</td><td className="table-cell"><span className={book.available_copies > 0 ? "badge-available" : "badge-unavailable"}>{book.available_copies > 0 ? `Available (${book.available_copies})` : "Unavailable"}</span><p className="mt-2 text-xs text-slate-500">{book.total_copies} total</p></td></tr>)}</tbody></table></div></div>
      <div className="mt-5 flex items-center justify-between text-sm text-slate-600"><p>{total} {total === 1 ? "book" : "books"}</p><div className="flex items-center gap-3"><button className="button-secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="button-secondary" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
    </>}
  </AppShell>;
}
