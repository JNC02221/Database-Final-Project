"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useSyncExternalStore, type ReactNode } from "react";
import ThemeToggle from "@/components/theme-toggle";

const features = [
  { label: "Search the catalogue", icon: <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /> },
  { label: "Track loans and due dates", icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></> },
  { label: "Get due-date reminders", icon: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></> },
];

function subscribeToHydration() { return () => undefined; }
function useHydrated() { return useSyncExternalStore(subscribeToHydration, () => true, () => false); }

export default function AuthCard({ title, subtitle, children, leaving = false, compact = false }: { title: string; subtitle: string; children: ReactNode; leaving?: boolean; compact?: boolean }) {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const enter = () => hydrated ? reduceMotion ? { opacity: [0.9, 1] } : { opacity: [0.84, 1], y: [10, 0] } : { opacity: 1, y: 0 };
  const featureListVariants = {
    rest: { opacity: 1 },
    show: { opacity: 1, transition: reduceMotion ? {} : { delayChildren: 0.18, staggerChildren: 0.09 } },
  };
  const featureVariants = {
    rest: { opacity: 1, y: 0 },
    show: reduceMotion
      ? { opacity: [0.92, 1], y: 0, transition: { duration: 0.25 } }
      : { opacity: [0.82, 1], y: [10, 0], transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <main className="app-page relative min-h-screen lg:grid lg:h-screen lg:min-h-0 lg:grid-cols-[minmax(380px,0.9fr)_minmax(520px,1.1fr)] lg:overflow-hidden">
      <div className="absolute right-4 top-4 z-20"><ThemeToggle /></div>
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-blue-700 px-6 py-8 text-white sm:px-10 lg:flex lg:h-screen lg:min-h-0 lg:flex-col lg:justify-between lg:px-14 lg:py-10">
        <motion.div initial={false} animate={hydrated && !reduceMotion ? { x: [0, 24, -8, 0], y: [0, 14, -10, 0], scale: [1, 1.08, 0.96, 1] } : { x: 0, y: 0, scale: 1 }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-current/15 blur-3xl" />
        <motion.div initial={false} animate={hydrated && !reduceMotion ? { x: [0, -20, 10, 0], y: [0, -18, 8, 0], scale: [1, 0.94, 1.06, 1] } : { x: 0, y: 0, scale: 1 }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute -bottom-28 -right-20 size-80 rounded-full bg-cyan-300/20 blur-3xl" />
        <motion.div initial={false} animate={hydrated && !reduceMotion ? { x: [0, 14, -14, 0], y: [0, -12, 16, 0], scale: [1, 1.1, 0.98, 1] } : { x: 0, y: 0, scale: 1 }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute left-1/2 top-1/3 size-48 rounded-full bg-fuchsia-300/10 blur-3xl" />

        <motion.div initial={false} animate={enter()} transition={{ duration: 0.45, ease: "easeOut" }} className="relative flex items-center gap-3 text-xl font-bold tracking-tight">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-current/15 ring-1 ring-current/30 backdrop-blur">
            <svg width="24" height="24" viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
          </span>
          LibraTrack
        </motion.div>

        <motion.div initial={false} animate={enter()} transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.08, ease: "easeOut" }} className="relative my-8 max-w-lg lg:my-auto lg:py-8">
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">Your library,<br />always in order.</h2>
          <p className="mt-4 max-w-md text-base leading-7 text-indigo-100">Everything you need to discover books and stay on top of your library account.</p>
        </motion.div>

        <motion.ul initial={false} animate={hydrated ? "show" : "rest"} variants={featureListVariants} className="relative hidden text-sm font-medium text-indigo-50 sm:grid sm:grid-cols-3 sm:gap-4 lg:block lg:space-y-4">
          {features.map((feature) => <motion.li variants={featureVariants} whileHover={reduceMotion ? undefined : { x: 4 }} key={feature.label} className="flex items-center gap-3">
            <motion.span whileHover={reduceMotion ? undefined : { scale: 1.1, rotate: 3 }} transition={{ type: "spring", stiffness: 350, damping: 18 }} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-current/10 ring-1 ring-current/20">
              <svg width="20" height="20" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{feature.icon}</svg>
            </motion.span>
            {feature.label}
          </motion.li>)}
        </motion.ul>
      </section>

      <section className="flex min-h-[60vh] items-center justify-center px-5 py-8 sm:px-10 lg:h-screen lg:min-h-0 lg:px-12 lg:py-4">
        <motion.div initial={false} animate={leaving ? { opacity: 0, y: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 0.99 } : hydrated ? reduceMotion ? { opacity: [0.9, 1] } : { opacity: [0.78, 1], y: [16, 0], scale: [0.985, 1] } : { opacity: 1, y: 0, scale: 1 }} transition={leaving ? { duration: reduceMotion ? 0.1 : 0.18 } : reduceMotion ? { duration: 0.25 } : { type: "spring", stiffness: 190, damping: 22, delay: 0.08 }} className={`surface w-full max-w-md rounded-3xl border shadow-xl dark:shadow-black/30 ${compact ? "p-5 sm:p-7" : "p-6 sm:p-9"}`}>
          <div className={compact ? "mb-5" : "mb-8"}><p className="eyebrow">Welcome to LibraTrack</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-primary">{title}</h1><p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p></div>
          {children}
        </motion.div>
      </section>
    </main>
  );
}
