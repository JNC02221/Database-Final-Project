"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="app-page flex min-h-screen items-center justify-center px-4"><div className="empty-card max-w-md"><h1 className="text-xl font-bold text-primary">Something went wrong</h1><p className="mt-2 text-sm text-muted">LibraTrack could not load this page.</p><button className="button-primary mt-5" onClick={reset}>Try again</button></div></main>;
}
