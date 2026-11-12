"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import AppShell from "@/components/app-shell";
import { AdminTable, EmptyState, Field, LoadingState, Modal, Notice, PageHeading, Pagination, SearchBar, requestJson } from "@/components/admin-ui";

type Book = { book_id: number; isbn: string; title: string; authors: string; category_name: string; publisher_name: string; edition: string | null; publication_year: number | null; language: string; shelf_location: string; total_copies: number; available_copies: number };
type BookForm = { isbn: string; title: string; authors: string; category: string; publisher: string; edition: string; publication_year: string; language: string; shelf_location: string; total_copies: string };
const blank: BookForm = { isbn: "", title: "", authors: "", category: "", publisher: "", edition: "", publication_year: "", language: "English", shelf_location: "", total_copies: "1" };

function formFor(book: Book): BookForm { return { isbn: book.isbn, title: book.title, authors: book.authors ?? "", category: book.category_name, publisher: book.publisher_name, edition: book.edition ?? "", publication_year: book.publication_year?.toString() ?? "", language: book.language, shelf_location: book.shelf_location, total_copies: String(book.total_copies) }; }
function payload(form: BookForm) { return { ...form, authors: form.authors.split(",").map((name) => name.trim()).filter(Boolean), total_copies: Number(form.total_copies), publication_year: form.publication_year ? Number(form.publication_year) : null }; }

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const pageSize = 15;
  const [input, setInput] = useState(""); const [query, setQuery] = useState(""); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [editing, setEditing] = useState<Book | null | undefined>(undefined);
  const [form, setForm] = useState<BookForm>(blank); const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    await Promise.resolve(); setLoading(true); setError("");
    try { const data = await requestJson<{ books: Book[]; total: number }>(`/api/admin/books?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`); setBooks(data.books); setTotal(data.total); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load books"); } finally { setLoading(false); }
  }, [page, query]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  function openAdd() { setForm(blank); setEditing(null); setError(""); }
  function openEdit(book: Book) { setForm(formFor(book)); setEditing(book); setError(""); }
  function update(key: keyof BookForm, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await requestJson(editing ? `/api/admin/books/${editing.book_id}` : "/api/admin/books", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload(form)) });
      setEditing(undefined); setSuccess(editing ? "Book updated" : "Book added"); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save book"); } finally { setSaving(false); }
  }
  async function changeCopies(book: Book, delta: number) {
    const next = book.total_copies + delta; if (next < 1) return;
    try { await requestJson(`/api/admin/books/${book.book_id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload({ ...formFor(book), total_copies: String(next) })) }); setSuccess(`Copies updated for ${book.title}`); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update copies"); }
  }
  async function remove(book: Book) {
    if (!window.confirm(`Delete “${book.title}”? This cannot be undone.`)) return;
    try { await requestJson(`/api/admin/books/${book.book_id}`, { method: "DELETE" }); setSuccess("Book deleted"); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete book"); }
  }

  return <AppShell><PageHeading eyebrow="Administration" title="Books" description="Add titles, edit metadata, and manage copy counts." action={<button className="button-primary" onClick={openAdd}>Add book</button>} />
    {success && <Notice message={success} onClose={() => setSuccess("")} />}{error && <Notice message={error} kind="error" onClose={() => setError("")} />}
    <SearchBar value={input} onChange={setInput} onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(input.trim()); }} placeholder="Search title, author, or ISBN" />
    {loading ? <LoadingState label="Loading books…" /> : books.length === 0 ? <EmptyState title="No books found" detail="Add a book or change the search." /> : <><AdminTable headings={["Book", "Category / Publisher", "Copies", "Actions"]}>{books.map((book) => <tr key={book.book_id} className="hover:bg-slate-50"><td className="table-cell"><p className="font-semibold text-slate-900">{book.title}</p><p className="text-slate-600">{book.authors}</p><p className="font-mono text-xs text-slate-400">{book.isbn}</p></td><td className="table-cell"><p>{book.category_name}</p><p className="text-slate-500">{book.publisher_name}</p></td><td className="table-cell"><p>{book.available_copies} available / {book.total_copies} total</p><div className="mt-2 flex gap-1"><button className="button-secondary px-2 py-1" onClick={() => void changeCopies(book, -1)} aria-label="Remove one copy">−</button><button className="button-secondary px-2 py-1" onClick={() => void changeCopies(book, 1)} aria-label="Add one copy">+</button></div></td><td className="table-cell"><div className="flex flex-wrap gap-2"><button className="button-secondary" onClick={() => openEdit(book)}>Edit</button><button className="button-danger" onClick={() => void remove(book)}>Delete</button></div></td></tr>)}</AdminTable><Pagination page={page} total={total} pageSize={pageSize} onPage={setPage} /></>}
    {editing !== undefined && <Modal title={editing ? "Edit book" : "Add book"} onClose={() => setEditing(undefined)} wide><form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      <Field label="ISBN"><input className="field-input" value={form.isbn} onChange={(e) => update("isbn", e.target.value)} required /></Field><Field label="Title"><input className="field-input" value={form.title} onChange={(e) => update("title", e.target.value)} required /></Field>
      <Field label="Authors (comma separated)"><input className="field-input" value={form.authors} onChange={(e) => update("authors", e.target.value)} required /></Field><Field label="Category"><input className="field-input" value={form.category} onChange={(e) => update("category", e.target.value)} required /></Field>
      <Field label="Publisher"><input className="field-input" value={form.publisher} onChange={(e) => update("publisher", e.target.value)} required /></Field><Field label="Edition"><input className="field-input" value={form.edition} onChange={(e) => update("edition", e.target.value)} /></Field>
      <Field label="Publication year"><input className="field-input" type="number" min="1000" max={new Date().getFullYear() + 1} value={form.publication_year} onChange={(e) => update("publication_year", e.target.value)} /></Field><Field label="Language"><input className="field-input" value={form.language} onChange={(e) => update("language", e.target.value)} required /></Field>
      <Field label="Shelf location"><input className="field-input" value={form.shelf_location} onChange={(e) => update("shelf_location", e.target.value)} required /></Field><Field label="Total copies"><input className="field-input" type="number" min="1" value={form.total_copies} onChange={(e) => update("total_copies", e.target.value)} required /></Field>
      <div className="sm:col-span-2 flex justify-end"><button className="button-primary" disabled={saving}>{saving ? "Saving…" : "Save book"}</button></div>
    </form></Modal>}
  </AppShell>;
}
