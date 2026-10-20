import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SettingsButton } from "./SettingsButton";

export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/90 px-6 py-3 backdrop-blur">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight">
          <span className="text-primary">see</span>ker<span className="text-accent">.</span>
        </Link>
        <nav className="ml-4 hidden gap-1 text-sm sm:flex">
          {[["/settings", "Settings"], ["/history", "History"], ["/privacy", "Privacy"], ["/terms", "Terms"]].map(([to, l]) => (
            <Link key={to} to={to as "/settings"} className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-1.5 bg-muted font-semibold text-foreground" }}>{l}</Link>
          ))}
        </nav>
        <div className="ml-auto"><SettingsButton /></div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-8 font-display text-4xl font-bold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function Section({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div><p className="text-sm font-medium">{label}</p>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Choice<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`rounded-md px-3 py-1.5 ${value === v ? "bg-card font-semibold text-foreground shadow-sm" : "text-muted-foreground"}`}>{l}</button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted-foreground/40"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}
