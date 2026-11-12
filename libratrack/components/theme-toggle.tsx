"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type ThemeState = "light" | "dark" | "pending";

function subscribe(callback: () => void) {
  window.addEventListener("libratrack-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("libratrack-theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getTheme(): ThemeState {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "pending");
  const reduceMotion = useReducedMotion();

  function toggleTheme() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("libratrack-theme", next);
    window.dispatchEvent(new Event("libratrack-theme-change"));
  }

  return (
    <button type="button" className="icon-button" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle dark mode">
      <AnimatePresence initial={false} mode="wait">
        <motion.span key={theme} initial={theme === "pending" || reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -70, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 70, scale: 0.7 }} transition={{ duration: 0.2 }} className="inline-flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
          {theme === "pending" ? <span className="block h-5 w-5 shrink-0 rounded-full bg-current opacity-25" /> : theme === "dark" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" className="h-full w-full shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" className="h-full w-full shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
