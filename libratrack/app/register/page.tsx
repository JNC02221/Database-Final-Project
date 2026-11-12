"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { useState, type FormEvent } from "react";
import AuthCard from "@/components/auth-card";
import AuthInput from "@/components/auth-input";
import { AuthError, AuthField, AuthSubmitButton, PasswordToggle } from "@/components/auth-motion";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const reduceMotion = useReducedMotion();
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: fullName, email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create account");
      setLeaving(true);
      if (!reduceMotion) await new Promise((resolve) => setTimeout(resolve, 180));
      router.replace("/login");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create account");
      setLoading(false);
    }
  }

  return <AuthCard title="Create your account" subtitle="Join LibraTrack to discover books and keep every due date in view." leaving={leaving} compact>
    <form onSubmit={submit} className="space-y-4">
      <AuthError message={error} />
      <AuthField index={0}>
        <AuthInput label="Full name" leadingIcon={<svg width="20" height="20" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" maxLength={150} required />
      </AuthField>
      <AuthField index={1}>
        <AuthInput label="Email address" leadingIcon={<svg width="20" height="20" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16v16H4z"/><path d="m4 6 8 6 8-6"/></svg>} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
      </AuthField>
      <AuthField index={2}>
        <AuthInput label="Password" leadingIcon={<svg width="20" height="20" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>} trailingControl={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((shown) => !shown)} />} helperText={<span className="mt-1 block text-xs font-normal text-subtle">Use at least 8 characters.</span>} type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required />
      </AuthField>
      <AuthField index={3}><AuthSubmitButton loading={loading} label="Create member account" loadingLabel="Creating account…" /></AuthField>
    </form>
    <p className="mt-5 text-center text-sm text-muted">Already registered? <Link className="font-semibold text-indigo-700 transition-colors hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300" href="/login">Sign in</Link></p>
  </AuthCard>;
}
