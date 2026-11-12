"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import AppShell from "@/components/app-shell";
import { AdminTable, EmptyState, Field, LoadingState, Modal, Notice, PageHeading, SearchBar, requestJson } from "@/components/admin-ui";

type Member = { user_id: number; full_name: string; email: string; phone: string | null; address: string | null; status: "ACTIVE" | "SUSPENDED"; created_at: string; active_loans: number; unpaid_fines_total: string };
type History = { loan_id: number; title: string; isbn: string; issue_date: string; due_date: string; return_date: string | null; status: string; fine_amount: string; paid_status: string | null };
type MemberForm = { full_name: string; email: string; password: string; phone: string; address: string; status: "ACTIVE" | "SUSPENDED" };
const blank: MemberForm = { full_name: "", email: "", password: "", phone: "", address: "", status: "ACTIVE" };
const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]); const [input, setInput] = useState(""); const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<Member | null | undefined>(undefined); const [form, setForm] = useState<MemberForm>(blank); const [saving, setSaving] = useState(false);
  const [historyMember, setHistoryMember] = useState<Member | null>(null); const [history, setHistory] = useState<History[]>([]); const [historyLoading, setHistoryLoading] = useState(false);
  const load = useCallback(async () => { await Promise.resolve(); setLoading(true); setError(""); try { const data = await requestJson<{ members: Member[] }>(`/api/admin/members?q=${encodeURIComponent(query)}`); setMembers(data.members); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load members"); } finally { setLoading(false); } }, [query]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  function update(key: keyof MemberForm, value: string) { setForm((current) => ({ ...current, [key]: value } as MemberForm)); }
  function openAdd() { setForm(blank); setEditing(null); }
  function openEdit(member: Member) { setForm({ full_name: member.full_name, email: member.email, password: "", phone: member.phone ?? "", address: member.address ?? "", status: member.status }); setEditing(member); }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try { await requestJson(editing ? `/api/admin/members/${editing.user_id}` : "/api/admin/members", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); setEditing(undefined); setSuccess(editing ? "Member updated" : "Member added"); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save member"); } finally { setSaving(false); }
  }
  async function toggle(member: Member) {
    const status = member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (!window.confirm(`${status === "SUSPENDED" ? "Suspend" : "Reactivate"} ${member.full_name}?`)) return;
    try { await requestJson(`/api/admin/members/${member.user_id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: member.full_name, phone: member.phone, address: member.address, status }) }); setSuccess(status === "ACTIVE" ? "Member reactivated" : "Member suspended"); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update member"); }
  }
  async function showHistory(member: Member) {
    setHistoryMember(member); setHistoryLoading(true);
    try { const data = await requestJson<{ loans: History[] }>(`/api/admin/members/${member.user_id}/loans`); setHistory(data.loans); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load history"); setHistoryMember(null); } finally { setHistoryLoading(false); }
  }
  return <AppShell><PageHeading eyebrow="Administration" title="Members" description="Manage member profiles, access status, and borrowing history." action={<button className="button-primary" onClick={openAdd}>Add member</button>} />
    {success && <Notice message={success} onClose={() => setSuccess("")} />}{error && <Notice message={error} kind="error" onClose={() => setError("")} />}
    <SearchBar value={input} onChange={setInput} onSubmit={(event) => { event.preventDefault(); setQuery(input.trim()); }} placeholder="Search name or email" />
    {loading ? <LoadingState label="Loading members…" /> : members.length === 0 ? <EmptyState title="No members found" detail="Add a member or change the search." /> : <AdminTable headings={["Member", "Status", "Joined", "Loans / Fines", "Actions"]}>{members.map((member) => <tr key={member.user_id} className="hover:bg-slate-50"><td className="table-cell"><p className="font-semibold text-slate-900">{member.full_name}</p><p className="text-slate-600">{member.email}</p><p className="text-xs text-slate-500">{member.phone || "No phone"}</p></td><td className="table-cell"><span className={member.status === "ACTIVE" ? "badge-available" : "badge-unavailable"}>{member.status}</span></td><td className="table-cell">{formatDate(member.created_at)}</td><td className="table-cell"><p>{member.active_loans} active</p><p className="text-slate-500">${Number(member.unpaid_fines_total).toFixed(2)} unpaid</p></td><td className="table-cell"><div className="flex flex-wrap gap-2"><button className="button-secondary" onClick={() => openEdit(member)}>Edit</button><button className="button-secondary" onClick={() => void showHistory(member)}>History</button><button className={member.status === "ACTIVE" ? "button-danger" : "button-primary"} onClick={() => void toggle(member)}>{member.status === "ACTIVE" ? "Suspend" : "Reactivate"}</button></div></td></tr>)}</AdminTable>}
    {editing !== undefined && <Modal title={editing ? "Edit member" : "Add member"} onClose={() => setEditing(undefined)}><form onSubmit={save} className="space-y-4"><Field label="Full name"><input className="field-input" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required /></Field>{!editing && <><Field label="Email"><input className="field-input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required /></Field><Field label="Temporary password"><input className="field-input" type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} required /></Field></>}<Field label="Phone"><input className="field-input" value={form.phone} onChange={(e) => update("phone", e.target.value)} /></Field><Field label="Address"><input className="field-input" value={form.address} onChange={(e) => update("address", e.target.value)} /></Field>{editing && <Field label="Status"><select className="field-input" value={form.status} onChange={(e) => update("status", e.target.value)}><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select></Field>}<div className="flex justify-end"><button className="button-primary" disabled={saving}>{saving ? "Saving…" : "Save member"}</button></div></form></Modal>}
    {historyMember && <Modal title={`${historyMember.full_name} — loan history`} onClose={() => setHistoryMember(null)} wide>{historyLoading ? <LoadingState /> : history.length === 0 ? <EmptyState title="No borrowing history" detail="This member has not borrowed a book." /> : <AdminTable headings={["Book", "Issued", "Due / Returned", "Status", "Fine"]}>{history.map((loan) => <tr key={loan.loan_id}><td className="table-cell"><p className="font-medium">{loan.title}</p><p className="font-mono text-xs text-slate-500">{loan.isbn}</p></td><td className="table-cell">{formatDate(loan.issue_date)}</td><td className="table-cell"><p>{formatDate(loan.due_date)}</p><p className="text-slate-500">{loan.return_date ? `Returned ${formatDate(loan.return_date)}` : "Not returned"}</p></td><td className="table-cell">{loan.status}</td><td className="table-cell">${Number(loan.fine_amount).toFixed(2)} {loan.paid_status && `(${loan.paid_status})`}</td></tr>)}</AdminTable>}</Modal>}
  </AppShell>;
}
