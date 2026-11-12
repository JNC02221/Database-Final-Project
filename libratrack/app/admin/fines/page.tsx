"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { AdminTable, EmptyState, LoadingState, Notice, PageHeading, requestJson, StatusBadge } from "@/components/admin-ui";

type Fine = { fine_id: number; loan_id: number; member_name: string; book_title: string; amount: string; days_overdue: number; paid_status: "UNPAID" | "PAID"; paid_date: string | null };
const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));

export default function AdminFinesPage() {
  const [fines, setFines] = useState<Fine[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const load = useCallback(async () => { await Promise.resolve(); setLoading(true); setError(""); try { const data = await requestJson<{ fines: Fine[] }>("/api/admin/fines"); setFines(data.fines); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load fines"); } finally { setLoading(false); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  async function pay(fine: Fine) { if (!window.confirm(`Mark the $${Number(fine.amount).toFixed(2)} fine for ${fine.member_name} as paid?`)) return; try { await requestJson(`/api/admin/fines/${fine.fine_id}/pay`, { method: "POST" }); setSuccess("Fine marked as paid"); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update fine"); } }
  return <AppShell><PageHeading eyebrow="Circulation" title="Fines" description="Review overdue charges and record payments." />{success && <Notice message={success} onClose={() => setSuccess("")} />}{error && <Notice message={error} kind="error" onClose={() => setError("")} />}
    {loading ? <LoadingState label="Loading fines…" /> : fines.length === 0 ? <EmptyState title="No fines" detail="Overdue return charges will appear here." /> : <AdminTable headings={["Member / Book", "Overdue", "Amount", "Status", "Action"]}>{fines.map((fine) => <tr key={fine.fine_id} className="table-row"><td className="table-cell"><p className="font-semibold">{fine.member_name}</p><p className="text-muted">{fine.book_title}</p></td><td className="table-cell">{fine.days_overdue} days</td><td className="table-cell font-semibold">${Number(fine.amount).toFixed(2)}</td><td className="table-cell"><StatusBadge status={fine.paid_status} />{fine.paid_date && <p className="mt-1 text-xs text-subtle">{formatDate(fine.paid_date)}</p>}</td><td className="table-cell">{fine.paid_status === "UNPAID" ? <button className="button-primary" onClick={() => void pay(fine)}>Mark paid</button> : "—"}</td></tr>)}</AdminTable>}
  </AppShell>;
}
