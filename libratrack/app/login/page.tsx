"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AuthCard from "@/components/auth-card";

export default function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const router = useRouter();
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Unable to sign in");
      router.replace(data.role === "ADMIN" ? "/admin" : "/catalogue"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to sign in"); setLoading(false); }
  }
  return <AuthCard title="Welcome back" subtitle="Sign in to browse the collection and manage your library account.">
    <form onSubmit={submit} className="mt-7 space-y-5">{error && <div className="alert-error" role="alert">{error}</div>}
      <label className="field-label">Email address<input className="field-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label className="field-label">Password<input className="field-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
      <button className="button-primary w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
    </form><p className="mt-6 text-center text-sm text-slate-600">New to LibraTrack? <Link className="font-semibold text-indigo-700 hover:text-indigo-600" href="/register">Create an account</Link></p>
  </AuthCard>;
}
