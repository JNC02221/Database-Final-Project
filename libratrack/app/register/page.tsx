"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AuthCard from "@/components/auth-card";

export default function RegisterPage() {
  const [fullName, setFullName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const router = useRouter();
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: fullName, email, password }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Unable to create account"); router.replace("/login");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create account"); setLoading(false); }
  }
  return <AuthCard title="Create your account" subtitle="Member accounts can browse the catalogue and track current loans and fines.">
    <form onSubmit={submit} className="mt-7 space-y-5">{error && <div className="alert-error" role="alert">{error}</div>}
      <label className="field-label">Full name<input className="field-input" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={150} required /></label>
      <label className="field-label">Email address<input className="field-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label className="field-label">Password<input className="field-input" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /><span className="mt-1 text-xs font-normal text-slate-500">At least 8 characters</span></label>
      <button className="button-primary w-full" disabled={loading}>{loading ? "Creating account…" : "Create member account"}</button>
    </form><p className="mt-6 text-center text-sm text-slate-600">Already registered? <Link className="font-semibold text-indigo-700 hover:text-indigo-600" href="/login">Sign in</Link></p>
  </AuthCard>;
}
