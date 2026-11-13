"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import AuthCard from "@/components/auth-card";
import AuthInput from "@/components/auth-input";
import { AuthError, AuthField, AuthSubmitButton, PasswordToggle } from "@/components/auth-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/login") return;
    const timer = window.setTimeout(() => {
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setError("");
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to sign in");
      router.replace(data.role === "ADMIN" ? "/admin" : "/catalog");
      router.refresh();
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return <AuthCard title="Welcome back" subtitle="Sign in to browse the collection and manage your library account.">
    <form onSubmit={submit} className="space-y-5">
      <AuthError message={error} />
      <AuthField index={0}>
        <AuthInput label="Email address" leadingIcon={<svg width="20" height="20" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16v16H4z"/><path d="m4 6 8 6 8-6"/></svg>} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
      </AuthField>
      <AuthField index={1}>
        <AuthInput label="Password" leadingIcon={<svg width="20" height="20" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>} trailingControl={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((shown) => !shown)} />} type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
      </AuthField>
      <AuthField index={2}><AuthSubmitButton loading={loading} label="Sign in" loadingLabel="Signing in…" /></AuthField>
    </form>
    <p className="mt-7 text-center text-sm text-muted">Don&apos;t have an account? <Link className="gold-link font-semibold text-indigo-700 transition-colors hover:text-indigo-600" href="/register">Register</Link></p>
  </AuthCard>;
}
