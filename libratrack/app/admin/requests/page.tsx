"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { AdminTable, EmptyState, LoadingState, Notice, PageHeading, requestJson } from "@/components/admin-ui";

type BookRequest = { reservation_id: number; member_name: string; book_title: string; available_copies: number; status: string; reserved_on: string; expires_on: string | null };
const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<BookRequest[]>([]); const [status, setStatus] = useState("all"); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const load = useCallback(async () => { await Promise.resolve(); setLoading(true); setError(""); try { const data = await requestJson<{ requests: BookRequest[] }>(`/api/admin/requests?status=${status}`); setRequests(data.requests); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load requests"); } finally { setLoading(false); } }, [status]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  async function act(item: BookRequest, action: "approve" | "cancel") {
    const label = action === "approve" ? "approve and issue" : "cancel"; if (!window.confirm(`${label[0].toUpperCase() + label.slice(1)} “${item.book_title}” for ${item.member_name}?`)) return;
    try { await requestJson(`/api/admin/requests/${item.reservation_id}/${action}`, { method: "POST" }); setSuccess(action === "approve" ? "Request approved and book issued" : "Request cancelled"); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : `Unable to ${action} request`); }
  }
  return <AppShell><PageHeading eyebrow="Circulation" title="Book requests" description="Review member requests in oldest-first order and issue available books." />
    {success && <Notice message={success} onClose={() => setSuccess("")} />}{error && <Notice message={error} kind="error" onClose={() => setError("")} />}
    <div className="mb-5 flex flex-wrap gap-2">{["all", "PENDING", "READY", "FULFILLED", "CANCELLED", "EXPIRED"].map((value) => <button key={value} className={status === value ? "button-primary" : "button-secondary"} onClick={() => setStatus(value)}>{value === "all" ? "All" : value}</button>)}</div>
    {loading ? <LoadingState label="Loading requests…" /> : requests.length === 0 ? <EmptyState title="No requests found" detail="No book requests match this status." /> : <AdminTable headings={["Member / Book", "Availability", "Requested", "Status", "Actions"]}>{requests.map((item) => { const open = item.status === "PENDING" || item.status === "READY"; return <tr key={item.reservation_id} className="hover:bg-slate-50"><td className="table-cell"><p className="font-semibold">{item.member_name}</p><p className="text-slate-600">{item.book_title}</p></td><td className="table-cell"><span className={item.available_copies > 0 ? "badge-available" : "badge-unavailable"}>{item.available_copies} available</span></td><td className="table-cell">{formatDate(item.reserved_on)}</td><td className="table-cell">{item.status}</td><td className="table-cell">{open ? <div className="flex flex-wrap gap-2"><button className="button-primary" onClick={() => void act(item, "approve")}>Approve and issue</button><button className="button-danger" onClick={() => void act(item, "cancel")}>Cancel</button></div> : "—"}</td></tr>; })}</AdminTable>}
  </AppShell>;
}
