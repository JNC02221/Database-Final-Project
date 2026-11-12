"use client";

import type { FormEvent, ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{eyebrow}</p><h1 className="page-title">{title}</h1><p className="page-subtitle">{description}</p></div>{action}</div>;
}

export function Notice({ message, kind = "success", onClose }: { message: string; kind?: "success" | "error"; onClose?: () => void }) {
  return <div className={`mb-5 flex items-center justify-between gap-4 ${kind === "error" ? "alert-error" : "alert-success"}`} role="status"><span>{message}</span>{onClose && <button type="button" onClick={onClose} className="font-bold" aria-label="Dismiss">×</button>}</div>;
}

export function LoadingState({ label = "Loading…" }: { label?: string }) { return <div className="loading-card">{label}</div>; }
export function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="empty-card"><h2 className="font-semibold text-primary">{title}</h2><p className="mt-1 text-sm">{detail}</p></div>; }

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const className = ["ACTIVE", "RETURNED", "FULFILLED", "PAID"].includes(normalized)
    ? "badge-available"
    : ["OVERDUE", "SUSPENDED", "UNPAID"].includes(normalized)
      ? "badge-unavailable"
      : normalized === "READY"
        ? "badge-warning"
        : ["ISSUED", "PENDING"].includes(normalized)
          ? "badge-info"
          : "badge-neutral";
  return <span className={className}>{status}</span>;
}

export function AdminTable({ headings, children }: { headings: string[]; children: ReactNode }) {
  return <div className="surface overflow-hidden rounded-xl border shadow-sm dark:shadow-black/20"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="surface-muted text-xs uppercase tracking-wide text-subtle"><tr>{headings.map((heading) => <th className="table-cell" key={heading}>{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody></table></div></div>;
}

export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`surface max-h-[90vh] w-full overflow-y-auto rounded-2xl border p-6 shadow-2xl dark:shadow-black/60 ${wide ? "max-w-4xl" : "max-w-xl"}`}><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-primary">{title}</h2><button type="button" className="button-secondary" onClick={onClose}>Close</button></div>{children}</section></div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field-label">{label}{children}</label>; }

export function SearchBar({ value, onChange, onSubmit, placeholder = "Search" }: { value: string; onChange: (value: string) => void; onSubmit: (event: FormEvent) => void; placeholder?: string }) {
  return <form onSubmit={onSubmit} className="panel mb-5 flex gap-3 p-4"><input className="field-input mt-0" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><button className="button-primary">Search</button></form>;
}

export function Pagination({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="mt-5 flex items-center justify-between text-sm text-muted"><span>{total} total</span><div className="flex items-center gap-3"><button className="button-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="button-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button></div></div>;
}

export async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: string }).error ?? "The request could not be completed");
  return data as T;
}
