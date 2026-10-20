import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSettings, type Theme } from "@/lib/settings";

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [s, update] = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const initial = (s.name.trim()[0] ?? "").toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button aria-label="Menu" onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">
        {initial || (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-72 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-search">
          <p className="px-2 pb-2 text-sm font-semibold">{s.name ? `Hi, ${s.name}` : "Seeker"}</p>
          <div className="mb-2 flex gap-1 rounded-lg bg-muted p-1 text-xs">
            {(["light", "system", "dark"] as Theme[]).map((t) => (
              <button key={t} onClick={() => update({ theme: t })}
                className={`flex-1 rounded-md py-1.5 capitalize ${s.theme === t ? "bg-card font-semibold text-foreground shadow-sm" : "text-muted-foreground"}`}>{t}</button>
            ))}
          </div>
          <label className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted">
            <span>Open sites inside Seeker</span>
            <input type="checkbox" checked={s.openInside} onChange={(e) => update({ openInside: e.target.checked })} className="h-4 w-4 accent-primary" />
          </label>
          <nav className="mt-1 flex flex-col border-t border-border pt-1 text-sm">
            {[
              ["/settings", "All settings"],
              ["/history", "History"],
              ["/privacy", "Data & privacy"],
              ["/terms", "Terms & conditions"],
            ].map(([to, label]) => (
              <Link key={to} to={to as "/settings"} onClick={() => setOpen(false)} className="rounded-md px-2 py-2 hover:bg-muted">{label}</Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
