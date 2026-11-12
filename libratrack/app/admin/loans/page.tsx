"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import AppShell from "@/components/app-shell";
import { AdminTable, EmptyState, Field, LoadingState, Notice, PageHeading, requestJson } from "@/components/admin-ui";

type Loan = { loan_id: number; user_id: number; member_name: string; book_id: number; book_title: string; issue_date: string; due_date: string; return_date: string | null; computed_status: "ACTIVE" | "OVERDUE" | "RETURNED"; fine_amount: string; fine_status: string | null };
type Member = { user_id: number; full_name: string; email: string; status: string };
type Book = { book_id: number; title: string; isbn: string; available_copies: number };
const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]); const [members, setMembers] = useState<Member[]>([]); const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState("all"); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [memberSearch, setMemberSearch] = useState(""); const [bookSearch, setBookSearch] = useState(""); const [userId, setUserId] = useState(""); const [bookId, setBookId] = useState(""); const [issuing, setIssuing] = useState(false);
  const load = useCallback(async () => { await Promise.resolve(); setLoading(true); setError(""); try { const data = await requestJson<{ loans: Loan[] }>(`/api/admin/loans?filter=${filter}`); setLoans(data.loans); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load loans"); } finally { setLoading(false); } }, [filter]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { requestJson<{ members: Member[] }>("/api/admin/members").then((data) => setMembers(data.members)).catch((reason: Error) => setError(reason.message)); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      requestJson<{ books: Book[] }>(`/api/admin/books?q=${encodeURIComponent(bookSearch)}&pageSize=50`)
        .then((data) => setBooks(data.books))
        .catch((reason: Error) => setError(reason.message));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [bookSearch]);
  const visibleMembers = useMemo(() => members.filter((member) => member.status === "ACTIVE" && `${member.full_name} ${member.email}`.toLowerCase().includes(memberSearch.toLowerCase())), [memberSearch, members]);
  const visibleBooks = books;
  async function issue(event: FormEvent) {
    event.preventDefault(); setIssuing(true); setError("");
    try { await requestJson("/api/admin/loans/issue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: Number(userId), bookId: Number(bookId) }) }); setSuccess("Book issued successfully"); setUserId(""); setBookId(""); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to issue book"); } finally { setIssuing(false); }
  }
  async function returnLoan(loan: Loan) {
    if (!window.confirm(`Return “${loan.book_title}” from ${loan.member_name}?`)) return;
    try { const data = await requestJson<{ fineAmount: string }>(`/api/admin/loans/${loan.loan_id}/return`, { method: "POST" }); const amount = Number(data.fineAmount); setSuccess(amount > 0 ? `Book returned; a $${amount.toFixed(2)} fine was created` : "Book returned successfully"); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to return book"); }
  }
  return <AppShell><PageHeading eyebrow="Circulation" title="Loans" description="Issue books, monitor overdue items, and process returns." />
    {success && <Notice message={success} onClose={() => setSuccess("")} />}{error && <Notice message={error} kind="error" onClose={() => setError("")} />}
    <form onSubmit={issue} className="mb-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-slate-900">Issue a book</h2><div className="grid gap-4 lg:grid-cols-2">
      <div><Field label="Search members"><input className="field-input" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Name or email" /></Field><Field label="Member"><select className="field-input" value={userId} onChange={(e) => setUserId(e.target.value)} required><option value="">Select member</option>{visibleMembers.map((member) => <option key={member.user_id} value={member.user_id}>{member.full_name} — {member.email}</option>)}</select></Field></div>
      <div><Field label="Search books"><input className="field-input" value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} placeholder="Title or ISBN" /></Field><Field label="Book"><select className="field-input" value={bookId} onChange={(e) => setBookId(e.target.value)} required><option value="">Select book</option>{visibleBooks.map((book) => <option key={book.book_id} value={book.book_id}>{book.title} — {book.available_copies} available</option>)}</select></Field></div>
    </div><button className="button-primary mt-4" disabled={issuing}>{issuing ? "Issuing…" : "Issue book"}</button></form>
    <div className="mb-4 flex flex-wrap gap-2">{["all", "active", "overdue", "returned"].map((value) => <button key={value} className={filter === value ? "button-primary" : "button-secondary"} onClick={() => setFilter(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div>
    {loading ? <LoadingState label="Loading loans…" /> : loans.length === 0 ? <EmptyState title="No loans found" detail="No loans match this filter." /> : <AdminTable headings={["Member / Book", "Issued", "Due", "Status", "Fine", "Action"]}>{loans.map((loan) => <tr key={loan.loan_id} className="hover:bg-slate-50"><td className="table-cell"><p className="font-semibold">{loan.member_name}</p><p className="text-slate-600">{loan.book_title}</p></td><td className="table-cell">{formatDate(loan.issue_date)}</td><td className="table-cell"><p className={loan.computed_status === "OVERDUE" ? "font-semibold text-red-700" : ""}>{formatDate(loan.due_date)}</p>{loan.return_date && <p className="text-xs text-slate-500">Returned {formatDate(loan.return_date)}</p>}</td><td className="table-cell"><span className={loan.computed_status === "OVERDUE" ? "badge-unavailable" : "badge-available"}>{loan.computed_status}</span></td><td className="table-cell">${Number(loan.fine_amount).toFixed(2)} {loan.fine_status && <span className="text-xs">({loan.fine_status})</span>}</td><td className="table-cell">{!loan.return_date ? <button className="button-primary" onClick={() => void returnLoan(loan)}>Return</button> : "—"}</td></tr>)}</AdminTable>}
  </AppShell>;
}
