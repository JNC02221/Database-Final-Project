"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((session: { role?: string } | null) => router.replace(session?.role === "ADMIN" ? "/admin" : session?.role === "MEMBER" ? "/catalogue" : "/login"))
      .catch(() => router.replace("/login"));
  }, [router]);
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">Opening LibraTrack…</main>;
}
