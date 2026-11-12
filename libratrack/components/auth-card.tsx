import type { ReactNode } from "react";

export default function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
    <div className="text-xl font-bold tracking-tight text-indigo-700">LibraTrack</div>
    <h1 className="mt-8 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
    <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>{children}
  </section></main>;
}
