"use client";

import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

function subscribeToHydration() { return () => undefined; }
function useHydrated() { return useSyncExternalStore(subscribeToHydration, () => true, () => false); }

export function AuthField({ children, index }: { children: ReactNode; index: number }) {
  const reduceMotion = useReducedMotion();
  const hydrated = useHydrated();
  const controls = useAnimationControls();

  useEffect(() => {
    if (!hydrated) return;

    const visible = { opacity: 1, y: 0 };
    controls.set(reduceMotion ? { opacity: 0.9, y: 0 } : { opacity: 0.84, y: 8 });
    void controls.start(visible, { duration: 0.35, delay: reduceMotion ? 0 : 0.16 + index * 0.07, ease: "easeOut" });
  }, [controls, hydrated, index, reduceMotion]);

  return <motion.div initial={false} animate={controls} className="auth-motion-safe">{children}</motion.div>;
}

export function AuthError({ message }: { message: string }) {
  const reduceMotion = useReducedMotion();
  return <AnimatePresence initial={false}>{message ? <motion.div key={message} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -7 }} animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, x: [0, -6, 5, -3, 0] }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }} transition={{ opacity: { duration: 0.2 }, y: { duration: 0.22 }, x: { duration: 0.32, delay: 0.06 } }} className="alert-error" role="alert">{message}</motion.div> : null}</AnimatePresence>;
}

export function AuthSubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  const reduceMotion = useReducedMotion();
  return <motion.button type="submit" className="button-primary h-11 w-full" disabled={loading} whileHover={loading || reduceMotion ? undefined : { y: -2 }} whileTap={loading || reduceMotion ? undefined : { scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}><AnimatePresence initial={false} mode="wait"><motion.span key={loading ? "loading" : "idle"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} className="inline-flex items-center justify-center">{loading && <span className="mr-2 size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden="true" />}{loading ? loadingLabel : label}</motion.span></AnimatePresence></motion.button>;
}

export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  const reduceMotion = useReducedMotion();
  return <button type="button" onClick={onToggle} className="password-toggle absolute inset-y-0 right-2 my-auto flex h-9 w-9 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1" aria-label={shown ? "Hide password" : "Show password"} aria-pressed={shown}><AnimatePresence initial={false} mode="wait"><motion.span key={shown ? "hidden" : "visible"} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -20, scale: 0.8 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 20, scale: 0.8 }} transition={{ duration: 0.16 }} className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{shown ? <svg width="20" height="20" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.7 10.7 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.1 3.2M6.6 6.6C3.8 8.5 2 12 2 12s3 8 10 8a10 10 0 0 0 5.4-1.6"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>}</motion.span></AnimatePresence></button>;
}
